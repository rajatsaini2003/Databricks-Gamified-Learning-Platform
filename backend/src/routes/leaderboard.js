const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const redisClient = require('../config/redis');
const authMiddleware = require('../middleware/auth');

// GET /api/leaderboard - Get global leaderboard
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        
        // Try to get from cache first, fall back to DB
        const result = await pool.query(
            `SELECT 
                id, username, tier, total_xp, avatar_url,
                RANK() OVER (ORDER BY total_xp DESC) as rank
             FROM users
             ORDER BY total_xp DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        
        // Get total count for pagination
        const countResult = await pool.query('SELECT COUNT(*) FROM users');
        
        res.json({
            leaderboard: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit,
            offset
        });
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/leaderboard/tier/:tier - Get tier-specific leaderboard
router.get('/tier/:tier', async (req, res) => {
    try {
        const tier = req.params.tier;
        const validTiers = ['Data Apprentice', 'Pipeline Builder', 'Code Sorcerer', 'Data Master'];
        
        if (!validTiers.includes(tier)) {
            return res.status(400).json({ error: 'Invalid tier' });
        }
        
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        
        const result = await pool.query(
            `SELECT 
                id, username, tier, total_xp, avatar_url,
                RANK() OVER (ORDER BY total_xp DESC) as rank
             FROM users
             WHERE tier = $1
             ORDER BY total_xp DESC
             LIMIT $2 OFFSET $3`,
            [tier, limit, offset]
        );
        
        res.json({
            tier,
            leaderboard: result.rows
        });
    } catch (error) {
        console.error('Tier Leaderboard Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/leaderboard/me - Get current user's rank
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // Get user's rank
        const result = await pool.query(
            `SELECT 
                u.id, u.username, u.tier, u.total_xp,
                (SELECT COUNT(*) + 1 FROM users WHERE total_xp > u.total_xp) as rank,
                (SELECT COUNT(*) FROM users) as total_users
             FROM users u
             WHERE u.id = $1`,
            [req.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get users around the current user
        const userXp = result.rows[0].total_xp;
        const nearby = await pool.query(
            `(SELECT id, username, tier, total_xp, 
                     RANK() OVER (ORDER BY total_xp DESC) as rank
              FROM users WHERE total_xp >= $1 ORDER BY total_xp ASC LIMIT 3)
             UNION ALL
             (SELECT id, username, tier, total_xp,
                     RANK() OVER (ORDER BY total_xp DESC) as rank
              FROM users WHERE total_xp < $1 ORDER BY total_xp DESC LIMIT 2)
             ORDER BY total_xp DESC`,
            [userXp]
        );
        
        res.json({
            user: result.rows[0],
            nearby: nearby.rows
        });
    } catch (error) {
        console.error('User Rank Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/leaderboard/island/:islandId - Get leaderboard by island progress
router.get('/island/:islandId', async (req, res) => {
    try {
        const islandId = req.params.islandId;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        
        const result = await pool.query(
            `SELECT 
                u.id, u.username, u.tier, u.avatar_url,
                COUNT(up.id) FILTER (WHERE up.completed = true) as completed_challenges,
                COALESCE(SUM(up.best_score), 0) as island_score,
                RANK() OVER (ORDER BY COALESCE(SUM(up.best_score), 0) DESC) as rank
             FROM users u
             LEFT JOIN user_progress up ON u.id = up.user_id
             LEFT JOIN challenges c ON up.challenge_id = c.id AND c.island_id = $1
             GROUP BY u.id
             HAVING COUNT(up.id) FILTER (WHERE up.completed = true) > 0
             ORDER BY island_score DESC
             LIMIT $2`,
            [islandId, limit]
        );
        
        res.json({
            island: islandId,
            leaderboard: result.rows
        });
    } catch (error) {
        console.error('Island Leaderboard Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
