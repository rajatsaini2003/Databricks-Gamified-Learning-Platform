const { pool } = require('../config/database');

/**
 * Streak Service - Handles daily login streak tracking and bonuses
 */

// Check and update user's streak on login
async function checkAndUpdateStreak(userId) {
    try {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get or create streak record
            let streakResult = await client.query(
                'SELECT * FROM streaks WHERE user_id = $1',
                [userId]
            );

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            let streakData;
            let xpBonus = 0;
            let notification = null;

            if (streakResult.rows.length === 0) {
                // First login ever - create streak record
                streakData = await client.query(
                    `INSERT INTO streaks (user_id, current_streak, longest_streak, last_login_date)
                     VALUES ($1, 1, 1, $2)
                     RETURNING *`,
                    [userId, today]
                );
                streakData = streakData.rows[0];
                xpBonus = 10; // First login bonus
            } else {
                const streak = streakResult.rows[0];
                const lastLogin = streak.last_login_date;

                // Skip if already logged in today
                if (lastLogin === today) {
                    return {
                        streak: streak.current_streak,
                        longestStreak: streak.longest_streak,
                        xpBonus: 0,
                        continued: false
                    };
                }

                // Check if streak continues or breaks
                if (lastLogin === yesterday) {
                    // Streak continues!
                    const newStreak = streak.current_streak + 1;
                    const newLongest = Math.max(newStreak, streak.longest_streak);

                    // Calculate bonus XP based on streak length
                    xpBonus = calculateStreakBonus(newStreak);

                    streakData = await client.query(
                        `UPDATE streaks 
                         SET current_streak = $1, 
                             longest_streak = $2, 
                             last_login_date = $3,
                             streak_bonuses_claimed = streak_bonuses_claimed + 1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $4
                         RETURNING *`,
                        [newStreak, newLongest, today, userId]
                    );
                    streakData = streakData.rows[0];

                    // Check for streak milestones
                    if (newStreak % 7 === 0) {
                        notification = {
                            type: 'streak_milestone',
                            title: `${newStreak}-Day Streak! 🔥`,
                            message: `Amazing! You've maintained a ${newStreak}-day login streak!`,
                            xpBonus: Math.floor(newStreak * 10)
                        };
                        xpBonus += notification.xpBonus;
                    }
                } else {
                    // Streak broken :(
                    streakData = await client.query(
                        `UPDATE streaks 
                         SET current_streak = 1, 
                             last_login_date = $1,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = $2
                         RETURNING *`,
                        [today, userId]
                    );
                    streakData = streakData.rows[0];
                    xpBonus = 10; // Base login bonus
                }
            }

            // Award XP bonus if any
            if (xpBonus > 0) {
                await client.query(
                    'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
                    [xpBonus, userId]
                );
            }

            // Create notification if milestone reached
            if (notification) {
                await client.query(
                    `INSERT INTO notifications (user_id, notification_type, title, message, data)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [userId, notification.type, notification.title, notification.message,
                        JSON.stringify({ xpBonus: notification.xpBonus })]
                );
            }

            await client.query('COMMIT');

            return {
                streak: streakData.current_streak,
                longestStreak: streakData.longest_streak,
                xpBonus,
                continued: true,
                notification
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Streak check error:', error);
        throw error;
    }
}

// Calculate XP bonus based on streak length
function calculateStreakBonus(streakDays) {
    if (streakDays <= 0) return 0;

    // Base bonus + increasing reward
    let bonus = 10; // Base daily login

    if (streakDays >= 3) bonus += 10;   // 3-day streak: +10
    if (streakDays >= 7) bonus += 20;   // 7-day streak: +20
    if (streakDays >= 14) bonus += 30;  // 14-day streak: +30
    if (streakDays >= 30) bonus += 50;  // 30-day streak: +50
    if (streakDays >= 60) bonus += 100; // 60-day streak: +100
    if (streakDays >= 100) bonus += 200; // 100-day streak: +200

    return bonus;
}

// Get user's current streak info
async function getUserStreak(userId) {
    try {
        const result = await pool.query(
            'SELECT * FROM streaks WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastLoginDate: null,
                bonusesClaimed: 0
            };
        }

        return {
            currentStreak: result.rows[0].current_streak,
            longestStreak: result.rows[0].longest_streak,
            lastLoginDate: result.rows[0].last_login_date,
            bonusesClaimed: result.rows[0].streak_bonuses_claimed
        };
    } catch (error) {
        console.error('Get streak error:', error);
        throw error;
    }
}

// Get streak leaderboard
async function getStreakLeaderboard(limit = 50) {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.tier, s.current_streak, s.longest_streak
             FROM streaks s
             JOIN users u ON s.user_id = u.id
             WHERE s.current_streak > 0
             ORDER BY s.current_streak DESC, s.longest_streak DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows;
    } catch (error) {
        console.error('Streak leaderboard error:', error);
        throw error;
    }
}

module.exports = {
    checkAndUpdateStreak,
    getUserStreak,
    getStreakLeaderboard,
    calculateStreakBonus
};
