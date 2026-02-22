const { pool } = require('../config/database');
const redisClient = require('../config/redis');
const geminiService = require('./geminiService');
const scoreCalculator = require('./scoreCalculator');

class ChallengeService {
  async getAllChallenges(userId) {
    // If userId provided, join with progress
    const query = userId
      ? `SELECT c.*, up.completed, up.score, up.best_score 
         FROM challenges c 
         LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
         ORDER BY c.order_index`
      : `SELECT * FROM challenges ORDER BY c.order_index`;

    const params = userId ? [userId] : [];
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getChallengeById(id) {
    const result = await pool.query('SELECT * FROM challenges WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getChallengesByIsland(islandId, userId) {
    const query = userId
      ? `SELECT c.*, up.completed 
         FROM challenges c 
         LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $2
         WHERE c.island_id = $1 
         ORDER BY c.order_index`
      : `SELECT * FROM challenges WHERE island_id = $1 ORDER BY order_index`;

    const params = userId ? [islandId, userId] : [islandId];
    const result = await pool.query(query, params);
    return result.rows;
  }

  async submitSolution(userId, challengeId, code, output, timeSpent) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get Challenge
      console.log(`[DEBUG] Looking for challenge ID: "${challengeId}"`);
      const challengeRes = await client.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
      const challenge = challengeRes.rows[0];

      if (!challenge) {
        console.log(`[ERROR] Challenge "${challengeId}" not found in database`);
        // List first 5 challenge IDs to help debug
        const allChallenges = await client.query('SELECT id FROM challenges LIMIT 5');
        console.log('Sample challenge IDs in DB:', allChallenges.rows.map(c => c.id));
        throw new Error('Challenge not found');
      }

      console.log(`[DEBUG] Found challenge: ${challenge.title}`);

      // 2. Validate with Gemini
      let validation;
      if (challenge.island_id === 'sql_shore') {
        validation = await geminiService.validateSQLSolution(challenge, code, output);
      } else {
        validation = await geminiService.validatePythonSolution(challenge, code, output);
      }

      // 3. Calculate Score
      const score = scoreCalculator.calculate(validation, timeSpent, challenge.difficulty);
      const xpEarned = scoreCalculator.calculateXP(score, challenge.difficulty);

      // 4. Update/Insert Progress
      const existingProgress = await client.query(
        'SELECT * FROM user_progress WHERE user_id = $1 AND challenge_id = $2',
        [userId, challengeId]
      );

      let isNewCompletion = false;

      if (existingProgress.rows.length === 0) {
        await client.query(
          `INSERT INTO user_progress 
           (user_id, challenge_id, completed, score, best_score, attempts, best_time, last_code, completed_at)
           VALUES ($1, $2, $3, $4, $5, 1, $6, $7, NOW())`,
          [userId, challengeId, validation.correct, score, score, timeSpent, code]
        );
        if (validation.correct) isNewCompletion = true;
      } else {
        const prev = existingProgress.rows[0];
        const newBestScore = Math.max(prev.best_score, score);
        const newBestTime = prev.best_time ? Math.min(prev.best_time, timeSpent) : timeSpent;

        await client.query(
          `UPDATE user_progress 
           SET completed = $1, score = $2, best_score = $3, 
               attempts = attempts + 1, best_time = $4, last_code = $5, 
               updated_at = NOW()
           WHERE id = $6`,
          [
            validation.correct || prev.completed,
            score,
            newBestScore,
            newBestTime,
            code,
            prev.id
          ]
        );
        if (validation.correct && !prev.completed) isNewCompletion = true;
      }

      // 5. Update User XP and Leaderboard
      if (isNewCompletion || (validation.correct && score > (existingProgress.rows[0]?.best_score || 0))) {
        // Only add XP diff if improving score, or full XP if first time?
        // Simplifying: Add full XP if first time. If improving, add diff?
        // Let's just add XP for first completion for MVP simplicity to avoid farming.

        if (isNewCompletion) {
          await client.query(
            'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
            [xpEarned, userId]
          );

          // Invalidate/Update Leaderboard Cache
          // For real-time, we might update Redis sorted set directly
          await redisClient.zincrby('leaderboard:global', xpEarned, userId);
        }
      }

      await client.query('COMMIT');

      return {
        validation,
        score,
        xpEarned: isNewCompletion ? xpEarned : 0,
        isNewCompletion
      };

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getHint(userId, challengeId, level) {
    // Check coins/currency logic here if needed
    const challenge = await this.getChallengeById(challengeId);
    // Retrieve user's last code to give contextual hint
    const progress = await pool.query('SELECT last_code FROM user_progress WHERE user_id=$1 AND challenge_id=$2', [userId, challengeId]);
    const lastCode = progress.rows[0]?.last_code || '';

    return await geminiService.generateHint(challenge, lastCode, level);
  }
}

module.exports = new ChallengeService();
