const { pool } = require('../config/database');
const redisClient = require('../config/redis');

class PvPService {
  // Find or create a match for a user
  async findOrCreateMatch(userId, challengeId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user already has a pending match for this challenge
      const existingMatch = await client.query(
        `SELECT * FROM pvp_matches 
         WHERE (player1_id = $1 OR player2_id = $1) 
         AND challenge_id = $2 
         AND status IN ('pending', 'active')`,
        [userId, challengeId]
      );
      
      if (existingMatch.rows.length > 0) {
        await client.query('COMMIT');
        return { match: existingMatch.rows[0], isNew: false };
      }
      
      // Look for a pending match waiting for opponent
      const pendingMatch = await client.query(
        `SELECT * FROM pvp_matches 
         WHERE player1_id != $1 
         AND player2_id IS NULL
         AND challenge_id = $2
         AND status = 'pending'
         AND expires_at > NOW()
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE`,
        [userId, challengeId]
      );
      
      if (pendingMatch.rows.length > 0) {
        // Join existing match
        const match = pendingMatch.rows[0];
        const updated = await client.query(
          `UPDATE pvp_matches 
           SET player2_id = $1, status = 'active', expires_at = NOW() + INTERVAL '24 hours'
           WHERE id = $2
           RETURNING *`,
          [userId, match.id]
        );
        
        await client.query('COMMIT');
        return { match: updated.rows[0], isNew: false, joined: true };
      }
      
      // Create new match
      const newMatch = await client.query(
        `INSERT INTO pvp_matches (challenge_id, player1_id, status, expires_at)
         VALUES ($1, $2, 'pending', NOW() + INTERVAL '1 hour')
         RETURNING *`,
        [challengeId, userId]
      );
      
      await client.query('COMMIT');
      return { match: newMatch.rows[0], isNew: true };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  
  // Get all matches for a user
  async getUserMatches(userId, status = null) {
    let query = `
      SELECT m.*, 
             c.title as challenge_title, 
             c.difficulty,
             u1.username as player1_username,
             u2.username as player2_username
      FROM pvp_matches m
      JOIN challenges c ON m.challenge_id = c.id
      JOIN users u1 ON m.player1_id = u1.id
      LEFT JOIN users u2 ON m.player2_id = u2.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
    `;
    
    const params = [userId];
    
    if (status) {
      query += ` AND m.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY m.created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Get match by ID
  async getMatch(matchId, userId) {
    const result = await pool.query(
      `SELECT m.*, 
              c.title as challenge_title, 
              c.description as challenge_description,
              c.difficulty,
              c.expected_output,
              c.datasets,
              u1.username as player1_username,
              u2.username as player2_username
       FROM pvp_matches m
       JOIN challenges c ON m.challenge_id = c.id
       JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       WHERE m.id = $1 AND (m.player1_id = $2 OR m.player2_id = $2)`,
      [matchId, userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const match = result.rows[0];
    
    // Hide opponent's code until match is complete
    if (match.status !== 'completed') {
      if (match.player1_id === userId) {
        match.player2_code = null;
        match.player2_score = null;
      } else {
        match.player1_code = null;
        match.player1_score = null;
      }
    }
    
    return match;
  }
  
  // Submit solution for a match
  async submitSolution(matchId, userId, code, score) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get match
      const matchResult = await client.query(
        `SELECT * FROM pvp_matches WHERE id = $1 FOR UPDATE`,
        [matchId]
      );
      
      if (matchResult.rows.length === 0) {
        throw new Error('Match not found');
      }
      
      const match = matchResult.rows[0];
      
      if (match.status !== 'active') {
        throw new Error('Match is not active');
      }
      
      if (match.player1_id !== userId && match.player2_id !== userId) {
        throw new Error('User not part of this match');
      }
      
      // Determine which player is submitting
      const isPlayer1 = match.player1_id === userId;
      
      // Check if already submitted
      if ((isPlayer1 && match.player1_submitted) || (!isPlayer1 && match.player2_submitted)) {
        throw new Error('Already submitted for this match');
      }
      
      // Update match with submission
      const updateFields = isPlayer1 
        ? { player1_code: code, player1_score: score, player1_submitted: true }
        : { player2_code: code, player2_score: score, player2_submitted: true };
      
      await client.query(
        `UPDATE pvp_matches 
         SET ${isPlayer1 ? 'player1_code' : 'player2_code'} = $1,
             ${isPlayer1 ? 'player1_score' : 'player2_score'} = $2,
             ${isPlayer1 ? 'player1_submitted' : 'player2_submitted'} = true
         WHERE id = $3`,
        [code, score, matchId]
      );
      
      // Check if both players have submitted
      const otherSubmitted = isPlayer1 ? match.player2_submitted : match.player1_submitted;
      
      if (otherSubmitted) {
        // Both submitted - determine winner
        const player1Score = isPlayer1 ? score : match.player1_score;
        const player2Score = isPlayer1 ? match.player2_score : score;
        
        let winnerId = null;
        if (player1Score > player2Score) {
          winnerId = match.player1_id;
        } else if (player2Score > player1Score) {
          winnerId = match.player2_id;
        }
        // If scores are equal, it's a draw (winnerId stays null)
        
        await client.query(
          `UPDATE pvp_matches 
           SET status = 'completed', 
               winner_id = $1,
               completed_at = NOW()
           WHERE id = $2`,
          [winnerId, matchId]
        );
        
        // Award XP to winner
        if (winnerId) {
          const xpReward = 100; // PvP win bonus
          await client.query(
            `UPDATE users SET total_xp = total_xp + $1 WHERE id = $2`,
            [xpReward, winnerId]
          );
          
          // Update leaderboard
          await redisClient.zincrby('leaderboard:global', xpReward, winnerId);
        }
        
        await client.query('COMMIT');
        return { 
          submitted: true, 
          matchComplete: true, 
          winnerId,
          player1Score,
          player2Score
        };
      }
      
      await client.query('COMMIT');
      return { submitted: true, matchComplete: false };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  
  // Cancel a pending match
  async cancelMatch(matchId, userId) {
    const result = await pool.query(
      `UPDATE pvp_matches 
       SET status = 'cancelled'
       WHERE id = $1 
       AND player1_id = $2 
       AND status = 'pending'
       RETURNING *`,
      [matchId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Cannot cancel this match');
    }
    
    return result.rows[0];
  }
  
  // Get available challenges for PvP
  async getPvPChallenges() {
    const result = await pool.query(
      `SELECT id, title, description, difficulty, island_id, section_id
       FROM challenges
       WHERE difficulty >= 2
       ORDER BY difficulty, title`
    );
    return result.rows;
  }
  
  // Get leaderboard for PvP wins
  async getPvPLeaderboard(limit = 10) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.tier,
              COUNT(CASE WHEN m.winner_id = u.id THEN 1 END) as wins,
              COUNT(CASE WHEN m.winner_id IS NOT NULL AND m.winner_id != u.id 
                         AND (m.player1_id = u.id OR m.player2_id = u.id) THEN 1 END) as losses,
              COUNT(CASE WHEN m.winner_id IS NULL AND m.status = 'completed'
                         AND (m.player1_id = u.id OR m.player2_id = u.id) THEN 1 END) as draws
       FROM users u
       LEFT JOIN pvp_matches m ON (m.player1_id = u.id OR m.player2_id = u.id) 
                                  AND m.status = 'completed'
       GROUP BY u.id, u.username, u.avatar_url, u.tier
       HAVING COUNT(m.id) > 0
       ORDER BY wins DESC, losses ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = new PvPService();
