const { pool } = require('../config/database');

/**
 * Reward Service - Handles daily rewards, cosmetic unlocks, and reward claiming
 */

// Get daily reward status for user
async function getDailyRewardStatus(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Check if today's reward exists
        const result = await pool.query(
            `SELECT * FROM daily_rewards 
             WHERE user_id = $1 AND reward_date = $2`,
            [userId, today]
        );

        if (result.rows.length === 0) {
            // Generate today's reward
            const reward = await generateDailyReward(userId, today);
            return {
                available: true,
                claimed: false,
                reward
            };
        }

        const todayReward = result.rows[0];
        return {
            available: true,
            claimed: todayReward.claimed,
            claimedAt: todayReward.claimed_at,
            reward: {
                type: todayReward.reward_type,
                value: todayReward.reward_value
            }
        };
    } catch (error) {
        console.error('Get daily reward error:', error);
        throw error;
    }
}

// Generate daily reward (varies by streak and day of week)
async function generateDailyReward(userId, date) {
    try {
        // Get user's streak to determine reward
        const streakResult = await pool.query(
            'SELECT current_streak FROM streaks WHERE user_id = $1',
            [userId]
        );

        const streak = streakResult.rows[0]?.current_streak || 0;
        const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday

        let rewardType = 'xp';
        let rewardValue = 50; // Base XP reward

        // Weekend bonus
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            rewardValue = 100;
        }

        // Streak multiplier
        if (streak >= 7) rewardValue = Math.floor(rewardValue * 1.5);
        if (streak >= 14) rewardValue = Math.floor(rewardValue * 1.75);
        if (streak >= 30) rewardValue = Math.floor(rewardValue * 2);

        // Special rewards every 7 days
        if (streak > 0 && streak % 7 === 0) {
            rewardType = 'cosmetic';
            // Award a random cosmetic based on streak
            const cosmeticResult = await pool.query(
                `SELECT id FROM cosmetics 
                 WHERE xp_cost <= $1 
                 ORDER BY RANDOM() 
                 LIMIT 1`,
                [streak * 100]
            );

            if (cosmeticResult.rows.length > 0) {
                rewardValue = cosmeticResult.rows[0].id;
            } else {
                // Fallback to XP if no cosmetics available
                rewardType = 'xp';
                rewardValue = streak * 50;
            }
        }

        // Insert reward into database
        await pool.query(
            `INSERT INTO daily_rewards (user_id, reward_date, reward_type, reward_value)
             VALUES ($1, $2, $3, $4)`,
            [userId, date, rewardType, rewardValue]
        );

        return {
            type: rewardType,
            value: rewardValue
        };
    } catch (error) {
        console.error('Generate daily reward error:', error);
        throw error;
    }
}

// Claim daily reward
async function claimDailyReward(userId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const today = new Date().toISOString().split('T')[0];

        // Get today's reward
        const rewardResult = await client.query(
            `SELECT * FROM daily_rewards 
             WHERE user_id = $1 AND reward_date = $2`,
            [userId, today]
        );

        if (rewardResult.rows.length === 0) {
            throw new Error('No reward available for today');
        }

        const reward = rewardResult.rows[0];

        if (reward.claimed) {
            throw new Error('Reward already claimed today');
        }

        // Mark reward as claimed
        await client.query(
            `UPDATE daily_rewards 
             SET claimed = true, claimed_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [reward.id]
        );

        // Apply reward
        if (reward.reward_type === 'xp') {
            await client.query(
                'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
                [reward.reward_value, userId]
            );
        } else if (reward.reward_type === 'cosmetic') {
            // Unlock cosmetic for user
            await client.query(
                `INSERT INTO user_cosmetics (user_id, cosmetic_id)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, cosmetic_id) DO NOTHING`,
                [userId, reward.reward_value]
            );
        } else if (reward.reward_type === 'multiplier') {
            // Apply XP multiplier
            await client.query(
                'UPDATE users SET xp_multiplier = xp_multiplier + ($1 / 100.0) WHERE id = $2',
                [reward.reward_value, userId]
            );
        }

        // Create notification
        await client.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, data)
             VALUES ($1, 'reward', 'Daily Reward Claimed! 🎁', $2, $3)`,
            [userId, `You received your daily reward!`,
                JSON.stringify({ rewardType: reward.reward_type, rewardValue: reward.reward_value })]
        );

        await client.query('COMMIT');

        return {
            success: true,
            reward: {
                type: reward.reward_type,
                value: reward.reward_value
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Claim reward error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Get cosmetics shop (available items)
async function getCosmetics(userId) {
    try {
        // Get user's owned cosmetics
        const ownedResult = await pool.query(
            `SELECT cosmetic_id FROM user_cosmetics WHERE user_id = $1`,
            [userId]
        );

        const ownedIds = ownedResult.rows.map(r => r.cosmetic_id);

        // Get all cosmetics
        const allCosmetics = await pool.query(
            `SELECT * FROM cosmetics ORDER BY rarity DESC, xp_cost ASC`
        );

        return allCosmetics.rows.map(cosmetic => ({
            ...cosmetic,
            owned: ownedIds.includes(cosmetic.id)
        }));
    } catch (error) {
        console.error('Get cosmetics error:', error);
        throw error;
    }
}

// Purchase cosmetic with XP
async function purchaseCosmetic(userId, cosmeticId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get cosmetic details
        const cosmeticResult = await client.query(
            'SELECT * FROM cosmetics WHERE id = $1',
            [cosmeticId]
        );

        if (cosmeticResult.rows.length === 0) {
            throw new Error('Cosmetic not found');
        }

        const cosmetic = cosmeticResult.rows[0];

        // Check if already owned
        const ownedResult = await client.query(
            'SELECT * FROM user_cosmetics WHERE user_id = $1 AND cosmetic_id = $2',
            [userId, cosmeticId]
        );

        if (ownedResult.rows.length > 0) {
            throw new Error('Cosmetic already owned');
        }

        // Get user's XP
        const userResult = await client.query(
            'SELECT total_xp FROM users WHERE id = $1',
            [userId]
        );

        const userXp = userResult.rows[0].total_xp;

        if (userXp < cosmetic.xp_cost) {
            throw new Error('Insufficient XP');
        }

        // Deduct XP
        await client.query(
            'UPDATE users SET total_xp = total_xp - $1 WHERE id = $2',
            [cosmetic.xp_cost, userId]
        );

        // Grant cosmetic
        await client.query(
            'INSERT INTO user_cosmetics (user_id, cosmetic_id) VALUES ($1, $2)',
            [userId, cosmeticId]
        );

        await client.query('COMMIT');

        return {
            success: true,
            cosmetic: cosmetic.name
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Purchase cosmetic error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Equip cosmetic
async function equipCosmetic(userId, cosmeticId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check ownership
        const ownedResult = await client.query(
            'SELECT * FROM user_cosmetics WHERE user_id = $1 AND cosmetic_id = $2',
            [userId, cosmeticId]
        );

        if (ownedResult.rows.length === 0) {
            throw new Error('Cosmetic not owned');
        }

        // Get cosmetic type
        const cosmeticResult = await client.query(
            'SELECT cosmetic_type FROM cosmetics WHERE id = $1',
            [cosmeticId]
        );

        const cosmeticType = cosmeticResult.rows[0].cosmetic_type;

        // Unequip all cosmetics of same type
        await client.query(
            `UPDATE user_cosmetics 
             SET equipped = false 
             WHERE user_id = $1 
             AND cosmetic_id IN (
                 SELECT id FROM cosmetics WHERE cosmetic_type = $2
             )`,
            [userId, cosmeticType]
        );

        // Equip the selected cosmetic
        await client.query(
            'UPDATE user_cosmetics SET equipped = true WHERE user_id = $1 AND cosmetic_id = $2',
            [userId, cosmeticId]
        );

        await client.query('COMMIT');

        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Equip cosmetic error:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getDailyRewardStatus,
    claimDailyReward,
    getCosmetics,
    purchaseCosmetic,
    equipCosmetic
};
