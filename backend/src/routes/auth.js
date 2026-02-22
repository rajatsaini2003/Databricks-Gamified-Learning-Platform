const express = require('express');
const router = express.Router();
const Joi = require('joi');
const authService = require('../services/authService');
const { pool } = require('../config/database');
const validator = require('../middleware/validator');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes (stricter than global)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many login attempts, please try again after 15 minutes'
});

// Schemas
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// POST /api/auth/register
router.post('/register', authLimiter, validator(registerSchema), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Conflict', message: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await authService.hashPassword(password);

        // Create user
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, hashedPassword]
        );

        // Generate token
        const token = authService.generateToken(newUser.rows[0].id);

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0],
            token
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, validator(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isMatch = await authService.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
        }

        // Update last login and activity
        await pool.query('UPDATE users SET last_login = NOW(), last_activity = NOW() WHERE id = $1', [user.id]);

        // Check and update streak (gamification)
        const streakService = require('../services/streakService');
        const achievementService = require('../services/achievementService');

        let streakData = null;
        let newAchievements = [];

        try {
            streakData = await streakService.checkAndUpdateStreak(user.id);
            // Check for new achievements
            newAchievements = await achievementService.checkAchievements(user.id);

            // Start a new session for tracking
            const sessionService = require('../services/sessionService');
            await sessionService.startSession(user.id);
        } catch (streakError) {
            console.error('Streak/Achievement check error:', streakError);
            // Don't fail login if gamification fails
        }

        // Generate tokens
        const token = authService.generateToken(user.id);
        const refreshToken = authService.generateRefreshToken(user.id);

        // Return user info (exclude hash)
        delete user.password_hash;

        res.json({
            message: 'Login successful',
            user,
            token,
            refreshToken,
            streak: streakData,
            newAchievements
        });
    } catch (error) {
        console.error('Login Error:', error);

        // DEMO MODE: Return demo user if database unavailable
        if (error.message === 'DATABASE_UNAVAILABLE' || error.code === 'ENOTFOUND') {
            console.log('🔄 Login in DEMO MODE');
            const demoUser = {
                id: 'demo-user-1',
                username: 'demo_user',
                email: req.body.email,
                total_xp: 1250,
                tier: 'Novice Navigator',
                created_at: new Date(),
                isDemo: true
            };

            const token = authService.generateToken(demoUser.id);

            return res.json({
                message: 'Login successful (Demo Mode)',
                user: demoUser,
                token,
                refreshToken: token,
                streak: { current: 3, longest: 5, lastLogin: new Date() },
                newAchievements: []
            });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, tier, total_xp, avatar_url, created_at FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Me Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'Bad Request', message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        // Ideally verify against DB/Redis whitelist
        const token = authService.generateToken(decoded.userId);
        res.json({ token });
    } catch (error) {
        return res.status(403).json({ error: 'Forbidden', message: 'Invalid refresh token' });
    }
});

// POST /api/auth/logout - End session on logout
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // End any open sessions for this user
        const sessionService = require('../services/sessionService');
        await sessionService.endSession(req.userId);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;