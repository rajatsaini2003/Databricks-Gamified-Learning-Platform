require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
    try {
        // Check user_progress.challenge_id type
        const up = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_progress' AND column_name = 'challenge_id'
        `);
        console.log('user_progress.challenge_id:', up.rows[0]);

        // Check achievements columns  
        const ach = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'achievements'
        `);
        console.log('achievements columns:', ach.rows.map(r => r.column_name));

        // Check challenges count
        const ch = await pool.query('SELECT COUNT(*) FROM challenges');
        console.log('challenges count:', ch.rows[0].count);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}

verify();
