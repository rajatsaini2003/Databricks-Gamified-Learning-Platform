const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rewardService = require('../services/rewardService');

// GET /api/rewards/daily - Get daily reward status
router.get('/daily', authMiddleware, async (req, res) => {
    try {
        const status = await rewardService.getDailyRewardStatus(req.userId);
        res.json(status);
    } catch (error) {
        console.error('Get daily reward error:', error);
        res.status(500).json({ error: 'Failed to fetch daily reward' });
    }
});

// POST /api/rewards/claim - Claim daily reward
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const result = await rewardService.claimDailyReward(req.userId);
        res.json(result);
    } catch (error) {
        console.error('Claim reward error:', error);

        if (error.message === 'No reward available for today' ||
            error.message === 'Reward already claimed today') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to claim reward' });
    }
});

// GET /api/rewards/cosmetics - Get cosmetics shop
router.get('/cosmetics', authMiddleware, async (req, res) => {
    try {
        const cosmetics = await rewardService.getCosmetics(req.userId);
        res.json(cosmetics);
    } catch (error) {
        console.error('Get cosmetics error:', error);
        res.status(500).json({ error: 'Failed to fetch cosmetics' });
    }
});

// POST /api/rewards/cosmetics/:id/purchase - Purchase cosmetic
router.post('/cosmetics/:id/purchase', authMiddleware, async (req, res) => {
    try {
        const result = await rewardService.purchaseCosmetic(req.userId, req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Purchase cosmetic error:', error);

        if (error.message === 'Cosmetic not found' ||
            error.message === 'Cosmetic already owned' ||
            error.message === 'Insufficient XP') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to purchase cosmetic' });
    }
});

// POST /api/rewards/cosmetics/:id/equip - Equip cosmetic
router.post('/cosmetics/:id/equip', authMiddleware, async (req, res) => {
    try {
        const result = await rewardService.equipCosmetic(req.userId, req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Equip cosmetic error:', error);

        if (error.message === 'Cosmetic not owned') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to equip cosmetic' });
    }
});

// GET /api/rewards/achievements - Get all achievements
router.get('/achievements', authMiddleware, async (req, res) => {
    try {
        const achievementService = require('../services/achievementService');
        const achievements = await achievementService.getAllAchievements(req.userId);
        res.json(achievements);
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

// GET /api/rewards/notifications - Get user notifications
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [req.userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST /api/rewards/notifications/:id/read - Mark notification as read
router.post('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const { pool } = require('../config/database');
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

module.exports = router;
