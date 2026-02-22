const { pool } = require('../config/database');

/**
 * Session Service - Tracks user session time for analytics
 */

// Start a new session
async function startSession(userId) {
    try {
        const result = await pool.query(
            `INSERT INTO session_time (user_id, session_start)
             VALUES ($1, CURRENT_TIMESTAMP)
             RETURNING id`,
            [userId]
        );

        // Update user's current session ID
        await pool.query(
            'UPDATE users SET current_session_id = $1, last_activity = CURRENT_TIMESTAMP WHERE id = $2',
            [result.rows[0].id, userId]
        );

        return result.rows[0].id;
    } catch (error) {
        console.error('Start session error:', error);
        throw error;
    }
}

// End a session
async function endSession(userId, sessionId = null) {
    try {
        let query;
        let params;

        if (sessionId) {
            // End specific session
            query = `UPDATE session_time 
                     SET session_end = CURRENT_TIMESTAMP,
                         duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - session_start))
                     WHERE id = $1 AND user_id = $2 AND session_end IS NULL
                     RETURNING *`;
            params = [sessionId, userId];
        } else {
            // End all open sessions for user
            query = `UPDATE session_time 
                     SET session_end = CURRENT_TIMESTAMP,
                         duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - session_start))
                     WHERE user_id = $1 AND session_end IS NULL
                     RETURNING *`;
            params = [userId];
        }

        const result = await pool.query(query, params);

        // Clear user's current session
        await pool.query(
            'UPDATE users SET current_session_id = NULL WHERE id = $1',
            [userId]
        );

        return result.rows;
    } catch (error) {
        console.error('End session error:', error);
        throw error;
    }
}

// Update session activity (heartbeat)
async function updateSessionActivity(userId, sessionId, challengesCompleted = 0, xpEarned = 0) {
    try {
        await pool.query(
            `UPDATE session_time 
             SET last_activity = CURRENT_TIMESTAMP,
                 challenges_completed = challenges_completed + $1,
                 xp_earned = xp_earned + $2
             WHERE id = $3 AND user_id = $4`,
            [challengesCompleted, xpEarned, sessionId, userId]
        );

        // Also update user's last activity
        await pool.query(
            'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );
    } catch (error) {
        console.error('Update session activity error:', error);
        throw error;
    }
}

// Get user's total session time
async function getTotalSessionTime(userId) {
    try {
        const result = await pool.query(
            `SELECT 
                COALESCE(SUM(duration_seconds), 0) as total_seconds,
                COUNT(*) as total_sessions,
                COALESCE(SUM(challenges_completed), 0) as total_challenges,
                COALESCE(SUM(xp_earned), 0) as total_xp
             FROM session_time 
             WHERE user_id = $1`,
            [userId]
        );

        const data = result.rows[0];
        const totalSeconds = parseInt(data.total_seconds);

        return {
            totalSeconds,
            totalMinutes: Math.floor(totalSeconds / 60),
            totalHours: Math.floor(totalSeconds / 3600),
            formatted: formatDuration(totalSeconds),
            totalSessions: parseInt(data.total_sessions),
            totalChallenges: parseInt(data.total_challenges),
            totalXp: parseInt(data.total_xp)
        };
    } catch (error) {
        console.error('Get total session time error:', error);
        throw error;
    }
}

// Get recent sessions
async function getRecentSessions(userId, limit = 10) {
    try {
        const result = await pool.query(
            `SELECT * FROM session_time 
             WHERE user_id = $1 
             ORDER BY session_start DESC 
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows.map(session => ({
            ...session,
            durationFormatted: formatDuration(session.duration_seconds || 0)
        }));
    } catch (error) {
        console.error('Get recent sessions error:', error);
        throw error;
    }
}

// Get session analytics
async function getSessionAnalytics(userId, days = 30) {
    try {
        const result = await pool.query(
            `SELECT 
                DATE(session_start) as date,
                SUM(duration_seconds) as total_seconds,
                COUNT(*) as session_count,
                SUM(challenges_completed) as challenges,
                SUM(xp_earned) as xp
             FROM session_time 
             WHERE user_id = $1 
               AND session_start >= CURRENT_DATE - INTERVAL '${days} days'
             GROUP BY DATE(session_start)
             ORDER BY DATE(session_start) DESC`,
            [userId]
        );

        return result.rows;
    } catch (error) {
        console.error('Get session analytics error:', error);
        throw error;
    }
}

// Helper function to format duration
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

module.exports = {
    startSession,
    endSession,
    updateSessionActivity,
    getTotalSessionTime,
    getRecentSessions,
    getSessionAnalytics,
    formatDuration
};
