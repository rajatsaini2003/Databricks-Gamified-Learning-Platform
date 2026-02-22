const { pool } = require('../config/database');

/**
 * Achievement Service - Auto-checks and unlocks achievements/badges based on user progress
 */

// Badge definitions (could also move to database)
const BADGE_DEFINITIONS = {
    first_query: {
        id: 'first_query',
        name: 'First Query',
        description: 'Complete your first SQL challenge',
        icon: 'target',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = true',
                [userId]
            );
            return parseInt(result.rows[0].count) >= 1;
        }
    },
    sql_novice: {
        id: 'sql_novice',
        name: 'SQL Novice',
        description: 'Complete 3 SQL challenges',
        icon: 'database',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = true',
                [userId]
            );
            return parseInt(result.rows[0].count) >= 3;
        }
    },
    streak_5: {
        id: 'streak_5',
        name: '5-Day Streak',
        description: 'Maintain a 5-day login streak',
        icon: 'flame',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT current_streak FROM streaks WHERE user_id = $1',
                [userId]
            );
            return result.rows[0]?.current_streak >= 5;
        }
    },
    streak_30: {
        id: 'streak_30',
        name: 'Month Champion',
        description: 'Maintain a 30-day login streak',
        icon: 'flame',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT current_streak FROM streaks WHERE user_id = $1',
                [userId]
            );
            return result.rows[0]?.current_streak >= 30;
        }
    },
    perfectionist: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete 10 challenges with perfect score',
        icon: 'award',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND best_score >= 100',
                [userId]
            );
            return parseInt(result.rows[0].count) >= 10;
        }
    },
    speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a challenge in under 60 seconds',
        icon: 'zap',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND best_time < 60',
                [userId]
            );
            return parseInt(result.rows[0].count) >= 1;
        }
    },
    island_master: {
        id: 'island_master',
        name: 'Island Master',
        description: 'Complete all challenges in an island',
        icon: 'map',
        checkFn: async (userId) => {
            // Check if user completed all challenges in any island
            const result = await pool.query(
                `SELECT c.island_id, 
                        COUNT(c.id) as total_challenges,
                        COUNT(up.challenge_id) FILTER (WHERE up.completed = true) as completed_challenges
                 FROM challenges c
                 LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
                 GROUP BY c.island_id
                 HAVING COUNT(c.id) = COUNT(up.challenge_id) FILTER (WHERE up.completed = true)`,
                [userId]
            );
            return result.rows.length > 0;
        }
    },
    python_master: {
        id: 'python_master',
        name: 'Python Master',
        description: 'Complete all Python Peninsula challenges',
        icon: 'file-code',
        checkFn: async (userId) => {
            const result = await pool.query(
                `SELECT COUNT(c.id) as total, 
                        COUNT(up.challenge_id) FILTER (WHERE up.completed = true) as completed
                 FROM challenges c
                 LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
                 WHERE c.island_id = 'python_peninsula'`,
                [userId]
            );
            const row = result.rows[0];
            return parseInt(row.total) > 0 && parseInt(row.total) === parseInt(row.completed);
        }
    },
    xp_1000: {
        id: 'xp_1000',
        name: 'XP Warrior',
        description: 'Reach 1000 total XP',
        icon: 'star',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT total_xp FROM users WHERE id = $1',
                [userId]
            );
            return result.rows[0]?.total_xp >= 1000;
        }
    },
    xp_5000: {
        id: 'xp_5000',
        name: 'XP Legend',
        description: 'Reach 5000 total XP',
        icon: 'trophy',
        checkFn: async (userId) => {
            const result = await pool.query(
                'SELECT total_xp FROM users WHERE id = $1',
                [userId]
            );
            return result.rows[0]?.total_xp >= 5000;
        }
    }
};

// Check and award all pending achievements for a user
async function checkAchievements(userId) {
    try {
        // Get user's existing achievements
        const existingResult = await pool.query(
            'SELECT badge_id FROM achievements WHERE user_id = $1',
            [userId]
        );

        const existingBadges = existingResult.rows.map(r => r.badge_id);
        const newAchievements = [];

        // Check each badge definition
        for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
            // Skip if already unlocked
            if (existingBadges.includes(badgeId)) {
                continue;
            }

            // Check if conditions are met
            const unlocked = await badge.checkFn(userId);

            if (unlocked) {
                // Award the badge
                await pool.query(
                    'INSERT INTO achievements (user_id, badge_id) VALUES ($1, $2)',
                    [userId, badgeId]
                );

                // Create notification
                await pool.query(
                    `INSERT INTO notifications (user_id, notification_type, title, message, data)
                     VALUES ($1, 'achievement', $2, $3, $4)`,
                    [userId, `Achievement Unlocked: ${badge.name}! 🏆`,
                        badge.description, JSON.stringify({ badgeId, icon: badge.icon })]
                );

                newAchievements.push({
                    id: badgeId,
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    justUnlocked: true
                });
            }
        }

        return newAchievements;
    } catch (error) {
        console.error('Check achievements error:', error);
        throw error;
    }
}

// Get all achievements for a user
async function getUserAchievements(userId) {
    try {
        const result = await pool.query(
            'SELECT badge_id, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
            [userId]
        );

        // Map to full badge info
        return result.rows.map(row => {
            const badgeDef = BADGE_DEFINITIONS[row.badge_id];
            return {
                id: row.badge_id,
                name: badgeDef?.name || row.badge_id,
                description: badgeDef?.description || '',
                icon: badgeDef?.icon || 'award',
                unlockedAt: row.unlocked_at
            };
        });
    } catch (error) {
        console.error('Get achievements error:', error);
        throw error;
    }
}

// Get all possible achievements with unlock status
async function getAllAchievements(userId) {
    try {
        const unlockedResult = await pool.query(
            'SELECT badge_id, unlocked_at FROM achievements WHERE user_id = $1',
            [userId]
        );

        const unlockedMap = {};
        unlockedResult.rows.forEach(row => {
            unlockedMap[row.badge_id] = row.unlocked_at;
        });

        return Object.entries(BADGE_DEFINITIONS).map(([badgeId, badge]) => ({
            id: badgeId,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            unlocked: !!unlockedMap[badgeId],
            unlockedAt: unlockedMap[badgeId] || null
        }));
    } catch (error) {
        console.error('Get all achievements error:', error);
        throw error;
    }
}

// Check milestones and award them
async function checkMilestones(userId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get user's existing milestones
        const existingResult = await client.query(
            'SELECT milestone_id FROM user_milestones WHERE user_id = $1',
            [userId]
        );

        const existingMilestones = existingResult.rows.map(r => r.milestone_id);

        // Get user stats
        const userResult = await client.query(
            'SELECT total_xp FROM users WHERE id = $1',
            [userId]
        );

        const totalXp = userResult.rows[0]?.total_xp || 0;

        const challengesResult = await client.query(
            'SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND completed = true',
            [userId]
        );

        const completedChallenges = parseInt(challengesResult.rows[0].count);

        const streakResult = await client.query(
            'SELECT current_streak FROM streaks WHERE user_id = $1',
            [userId]
        );

        const currentStreak = streakResult.rows[0]?.current_streak || 0;

        // Get all milestones
        const milestonesResult = await client.query(
            'SELECT * FROM milestones WHERE active = true'
        );

        const newMilestones = [];

        for (const milestone of milestonesResult.rows) {
            // Skip if already achieved
            if (existingMilestones.includes(milestone.id)) {
                continue;
            }

            let achieved = false;

            // Check threshold based on type
            switch (milestone.milestone_type) {
                case 'xp':
                    achieved = totalXp >= milestone.threshold;
                    break;
                case 'challenges':
                    achieved = completedChallenges >= milestone.threshold;
                    break;
                case 'streak':
                    achieved = currentStreak >= milestone.threshold;
                    break;
            }

            if (achieved) {
                // Award milestone
                await client.query(
                    'INSERT INTO user_milestones (user_id, milestone_id) VALUES ($1, $2)',
                    [userId, milestone.id]
                );

                // Award XP reward if any
                if (milestone.xp_reward > 0) {
                    await client.query(
                        'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
                        [milestone.xp_reward, userId]
                    );
                }

                // Create notification
                await client.query(
                    `INSERT INTO notifications (user_id, notification_type, title, message, data)
                     VALUES ($1, 'milestone', $2, $3, $4)`,
                    [userId, `Milestone Achieved: ${milestone.name}! 🎯`,
                        milestone.description, JSON.stringify({ xpReward: milestone.xp_reward })]
                );

                newMilestones.push(milestone);
            }
        }

        await client.query('COMMIT');

        return newMilestones;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Check milestones error:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    checkAchievements,
    getUserAchievements,
    getAllAchievements,
    checkMilestones,
    BADGE_DEFINITIONS
};
