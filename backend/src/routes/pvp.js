const express = require('express');
const router = express.Router();
const Joi = require('joi');
const pvpService = require('../services/pvpService');
const authMiddleware = require('../middleware/auth');
const validator = require('../middleware/validator');

// All routes require authentication
router.use(authMiddleware);

// GET /api/pvp - Get user's matches
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const matches = await pvpService.getUserMatches(req.userId, status);
        res.json({ matches });
    } catch (err) {
        console.error('Get matches error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pvp/challenges - Get available challenges for PvP
router.get('/challenges', async (req, res) => {
    try {
        const challenges = await pvpService.getPvPChallenges();
        res.json({ challenges });
    } catch (err) {
        console.error('Get PvP challenges error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pvp/leaderboard - Get PvP leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await pvpService.getPvPLeaderboard(limit);
        res.json({ leaderboard });
    } catch (err) {
        console.error('Get PvP leaderboard error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pvp/:matchId - Get match details
router.get('/:matchId', async (req, res) => {
    try {
        const match = await pvpService.getMatch(req.params.matchId, req.userId);
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        res.json({ match });
    } catch (err) {
        console.error('Get match error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/pvp/find - Find or create a match
const findMatchSchema = Joi.object({
    challengeId: Joi.string().required() // Accept any string, not just UUID
});

router.post('/find', validator(findMatchSchema), async (req, res) => {
    try {
        const { challengeId } = req.body;
        const result = await pvpService.findOrCreateMatch(req.userId, challengeId);
        res.json(result);
    } catch (err) {
        console.error('Find match error:', err);
        res.status(500).json({ error: err.message });
    }
});


// POST /api/pvp/:matchId/submit - Submit solution for a match
const submitSchema = Joi.object({
    code: Joi.string().required(),
    score: Joi.number().integer().min(0).optional(),
    output: Joi.object().optional(),
    timeSpent: Joi.number().optional()
});

router.post('/:matchId/submit', validator(submitSchema), async (req, res) => {
    try {
        const { code, output, timeSpent } = req.body;

        // Get match to find challenge ID
        const match = await pvpService.getMatch(req.params.matchId, req.userId);
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Validate solution using challengeService (includes Gemini AI)
        const challengeService = require('../services/challengeService');
        let validationResult;
        let finalScore = 0;

        try {
            console.log('PvP Validation - Calling challengeService for:', match.challenge_id);
            console.log('PvP Validation - User:', req.userId);
            console.log('PvP Validation - Code length:', code?.length);

            validationResult = await challengeService.submitSolution(
                req.userId,
                match.challenge_id,
                code,
                output,
                timeSpent || 0
            );
            console.log('PvP Validation - Result:', JSON.stringify(validationResult, null, 2));
            finalScore = validationResult.score || 0;
        } catch (err) {
            console.error('PvP Validation ERROR:', err.message);
            console.error('PvP Validation Stack:', err.stack);
            validationResult = {
                validation: {
                    correct: false,
                    feedback: { overall: `Validation failed: ${err.message}` }
                },
                score: 0
            };
        }

        // Submit to PvP with calculated score
        const result = await pvpService.submitSolution(
            req.params.matchId,
            req.userId,
            code,
            finalScore
        );

        // Include validation in response
        res.json({ ...result, validation: validationResult.validation, score: finalScore });
    } catch (err) {
        console.error('Submit match error:', err);
        res.status(400).json({ error: err.message });
    }
});


// DELETE /api/pvp/:matchId - Cancel a pending match
router.delete('/:matchId', async (req, res) => {
    try {
        const match = await pvpService.cancelMatch(req.params.matchId, req.userId);
        res.json({ message: 'Match cancelled', match });
    } catch (err) {
        console.error('Cancel match error:', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
