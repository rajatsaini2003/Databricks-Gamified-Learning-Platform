const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/users/me - Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, tier, total_xp, avatar_url, cosmetics, created_at, last_login
             FROM users WHERE id = $1`,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Get user progress stats
        let stats = { completed_challenges: 0, attempted_challenges: 0, total_score: 0, avg_score: 0 };
        try {
            const progressStats = await pool.query(
                `SELECT 
                    COUNT(*) FILTER (WHERE completed = true) as completed_challenges,
                    COUNT(*) as attempted_challenges,
                    COALESCE(SUM(best_score), 0) as total_score,
                    COALESCE(AVG(best_score), 0) as avg_score
                 FROM user_progress WHERE user_id = $1`,
                [req.userId]
            );
            stats = {
                completed_challenges: parseInt(progressStats.rows[0].completed_challenges) || 0,
                attempted_challenges: parseInt(progressStats.rows[0].attempted_challenges) || 0,
                total_score: parseInt(progressStats.rows[0].total_score) || 0,
                avg_score: parseFloat(progressStats.rows[0].avg_score) || 0
            };
        } catch (e) {
            console.log('Progress stats not available:', e.message);
        }

        // Get streak data (optional)
        let streakData = { currentStreak: 0, longestStreak: 0 };
        try {
            const streakService = require('../services/streakService');
            streakData = await streakService.getUserStreak(req.userId);
        } catch (e) {
            console.log('Streak data not available:', e.message);
        }

        // Get achievements (optional)
        let achievements = [];
        try {
            const achResult = await pool.query(
                `SELECT badge_id, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`,
                [req.userId]
            );
            achievements = achResult.rows;
        } catch (e) {
            console.log('Achievements not available:', e.message);
        }

        // Get equipped cosmetics (optional)
        let equippedCosmetics = [];
        try {
            const cosResult = await pool.query(
                `SELECT c.* FROM cosmetics c
                 JOIN user_cosmetics uc ON c.id = uc.cosmetic_id
                 WHERE uc.user_id = $1 AND uc.equipped = true`,
                [req.userId]
            );
            equippedCosmetics = cosResult.rows;
        } catch (e) {
            console.log('Cosmetics not available:', e.message);
        }

        // Calculate real rank from leaderboard
        let rank = 1;
        try {
            const rankResult = await pool.query(
                `SELECT COUNT(*) + 1 as rank 
                 FROM users 
                 WHERE total_xp > (SELECT total_xp FROM users WHERE id = $1)`,
                [req.userId]
            );
            rank = parseInt(rankResult.rows[0].rank);
        } catch (e) {
            console.log('Rank calculation failed:', e.message);
        }

        // Calculate total session time (optional)
        let timeSpent = '0h 0m';
        try {
            const sessionTimeResult = await pool.query(
                `SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
                 FROM session_time WHERE user_id = $1`,
                [req.userId]
            );
            const totalSeconds = parseInt(sessionTimeResult.rows[0].total_seconds);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            timeSpent = `${hours}h ${minutes}m`;
        } catch (e) {
            console.log('Session time not available:', e.message);
        }

        // Calculate tier based on XP
        const tier = calculateTier(user.total_xp);

        res.json({
            ...user,
            tier,
            rank,
            timeSpent,
            stats,
            streak: streakData,
            achievements,
            equippedCosmetics
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/users/:userId - Get user profile by ID
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, tier, total_xp, avatar_url, created_at 
             FROM users WHERE id = $1`,
            [req.params.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/users/me/progress - Get current user's progress
router.get('/me/progress', authMiddleware, async (req, res) => {
    try {
        const progress = await pool.query(
            `SELECT 
                up.*,
                c.island_id,
                c.section_id,
                c.title as challenge_title,
                c.difficulty
             FROM user_progress up
             JOIN challenges c ON up.challenge_id = c.id
             WHERE up.user_id = $1
             ORDER BY up.updated_at DESC`,
            [req.userId]
        );

        // Group by island
        const byIsland = {};
        progress.rows.forEach(p => {
            if (!byIsland[p.island_id]) {
                byIsland[p.island_id] = {
                    completed: 0,
                    attempted: 0,
                    challenges: []
                };
            }
            byIsland[p.island_id].challenges.push(p);
            if (p.completed) byIsland[p.island_id].completed++;
            byIsland[p.island_id].attempted++;
        });

        res.json({
            all: progress.rows,
            byIsland
        });
    } catch (error) {
        console.error('Get Progress Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/users/:userId/progress - Get user's progress by ID
router.get('/:userId/progress', authMiddleware, async (req, res) => {
    try {
        const progress = await pool.query(
            `SELECT up.*, c.island_id, c.section_id, c.title as challenge_title
             FROM user_progress up
             JOIN challenges c ON up.challenge_id = c.id
             WHERE up.user_id = $1`,
            [req.params.userId]
        );

        res.json(progress.rows);
    } catch (error) {
        console.error('Get Progress Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Helper function to calculate tier based on XP
function calculateTier(xp) {
    if (xp >= 10000) return 'Data Master';
    if (xp >= 5000) return 'Code Sorcerer';
    if (xp >= 2000) return 'Pipeline Builder';
    return 'Data Apprentice';
}

module.exports = router;
