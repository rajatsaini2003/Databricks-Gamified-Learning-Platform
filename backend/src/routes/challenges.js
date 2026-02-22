const express = require('express');
const router = express.Router();
const challengeService = require('../services/challengeService');
const authMiddleware = require('../middleware/auth');
const validator = require('../middleware/validator');
const Joi = require('joi');
const { pool } = require('../config/database');

// Islands metadata (static data)
const ISLANDS = [
    {
        id: 'sql_shore',
        name: 'SQL Shore',
        description: 'Master the fundamentals of SQL and data querying',
        theme: 'nautical',
        unlocked: true,
        sections: [
            { id: 'shores_of_selection', name: 'Selection Strait', description: 'Learn SELECT statements' },
            { id: 'join_junction', name: 'Join Junction', description: 'Master table joins' },
            { id: 'aggregation_atoll', name: 'Aggregation Atoll', description: 'GROUP BY and aggregates' },
            { id: 'subquery_sanctuary', name: 'Subquery Sanctuary', description: 'Nested queries' },
            { id: 'window_wharf', name: 'Window Wharf', description: 'Window functions' }
        ]
    },
    {
        id: 'python_peninsula',
        name: 'Python Peninsula',
        description: 'Learn PySpark and data transformation',
        theme: 'jungle',
        unlocked: false,
        requiredXP: 500,
        sections: [
            { id: 'dataframe_dunes', name: 'DataFrame Dunes', description: 'Create and manipulate DataFrames' },
            { id: 'transformation_trail', name: 'Transformation Trail', description: 'Data transformations' },
            { id: 'udf_undergrowth', name: 'UDF Undergrowth', description: 'User-defined functions' }
        ]
    }
];

// GET /api/challenges/islands - Get all islands with their sections
router.get('/islands', async (req, res) => {
    try {
        // Get challenge counts per section
        const counts = await pool.query(`
            SELECT island_id, section_id, COUNT(*) as challenge_count
            FROM challenges
            GROUP BY island_id, section_id
        `);

        const countMap = {};
        counts.rows.forEach(row => {
            if (!countMap[row.island_id]) countMap[row.island_id] = {};
            countMap[row.island_id][row.section_id] = parseInt(row.challenge_count);
        });

        // Enhance islands with counts
        const islands = ISLANDS.map(island => ({
            ...island,
            sections: island.sections.map(section => ({
                ...section,
                challengeCount: countMap[island.id]?.[section.id] || 0
            })),
            totalChallenges: island.sections.reduce((sum, s) =>
                sum + (countMap[island.id]?.[s.id] || 0), 0
            )
        }));

        res.json(islands);
    } catch (err) {
        console.error('Islands error:', err);

        // DEMO MODE: Return islands with default challenge counts
        if (err.message === 'DATABASE_UNAVAILABLE' || err.code === 'ENOTFOUND') {
            console.log('🔄 Islands endpoint in DEMO MODE');
            const demoIslands = ISLANDS.map(island => ({
                ...island,
                sections: island.sections.map(section => ({
                    ...section,
                    challengeCount: 5 // Default count for demo
                })),
                totalChallenges: island.sections.length * 5
            }));
            return res.json(demoIslands);
        }

        res.status(500).json({ error: 'Failed to fetch islands' });
    }
});

// GET /api/challenges - List all
router.get('/', authMiddleware, async (req, res) => {
    try {
        const challenges = await challengeService.getAllChallenges(req.userId);
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/challenges/island/:islandId - Get challenges for an island
router.get('/island/:islandId', authMiddleware, async (req, res) => {
    try {
        const challenges = await challengeService.getChallengesByIsland(req.params.islandId, req.userId);

        // Group by section
        const sections = {};
        challenges.forEach(c => {
            if (!sections[c.section_id]) {
                sections[c.section_id] = {
                    id: c.section_id,
                    challenges: []
                };
            }
            sections[c.section_id].challenges.push(c);
        });

        res.json({
            island: ISLANDS.find(i => i.id === req.params.islandId),
            sections: Object.values(sections),
            challenges
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper function to convert snake_case to camelCase
function toCamelCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCase);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

// GET /api/challenges/section/:islandId/:sectionId - Get challenges for a section
router.get('/section/:islandId/:sectionId', authMiddleware, async (req, res) => {
    try {
        const { islandId, sectionId } = req.params;

        const result = await pool.query(`
            SELECT c.*, up.completed, up.score, up.best_score, up.attempts
            FROM challenges c
            LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
            WHERE c.island_id = $2 AND c.section_id = $3
            ORDER BY c.order_index
        `, [req.userId, islandId, sectionId]);

        const island = ISLANDS.find(i => i.id === islandId);
        const section = island?.sections.find(s => s.id === sectionId);

        // Transform snake_case to camelCase for frontend compatibility
        const challenges = toCamelCase(result.rows);

        res.json({
            island,
            section,
            challenges
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/challenges/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const challenge = await challengeService.getChallengeById(req.params.id);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
        // Transform snake_case to camelCase for frontend compatibility
        res.json(toCamelCase(challenge));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/challenges/:id/submit
const submitSchema = Joi.object({
    code: Joi.string().required(),
    output: Joi.alternatives().try(Joi.object(), Joi.array(), Joi.string()).allow(null),
    timeSpent: Joi.number().integer().min(0).required()
});

router.post('/:id/submit', authMiddleware, validator(submitSchema), async (req, res) => {
    try {
        const { code, output, timeSpent } = req.body;
        const result = await challengeService.submitSolution(
            req.userId,
            req.params.id,
            code,
            output,
            timeSpent
        );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Submission failed', details: err.message });
    }
});

// GET /api/challenges/:id/hints/:level
router.get('/:id/hints/:level', authMiddleware, async (req, res) => {
    try {
        const hint = await challengeService.getHint(req.userId, req.params.id, parseInt(req.params.level));
        res.json(hint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;