require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    try {
        // Check table structure
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'challenges'
            ORDER BY ordinal_position
        `);
        console.log('Challenges table columns:');
        console.log(columns.rows);

        // Check if we have any data
        const count = await pool.query('SELECT COUNT(*) FROM challenges');
        console.log('\nChallenge count:', count.rows[0].count);

        // Truncate and set up for VARCHAR ids if needed
        if (columns.rows.find(c => c.column_name === 'id' && c.data_type === 'uuid')) {
            console.log('\n⚠️  Table has UUID id, need to recreate...');

            // First, alter the foreign key columns in other tables to VARCHAR
            console.log('Altering user_progress.challenge_id to VARCHAR...');
            await pool.query(`
                ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_challenge_id_fkey
            `);
            await pool.query(`
                ALTER TABLE user_progress ALTER COLUMN challenge_id TYPE VARCHAR(100)
            `);

            console.log('Altering pvp_matches.challenge_id to VARCHAR...');
            await pool.query(`
                ALTER TABLE pvp_matches DROP CONSTRAINT IF EXISTS pvp_matches_challenge_id_fkey
            `);
            await pool.query(`
                ALTER TABLE pvp_matches ALTER COLUMN challenge_id TYPE VARCHAR(100)
            `);

            // Now drop and recreate challenges table
            console.log('Dropping and recreating challenges table...');
            await pool.query('DROP TABLE IF EXISTS challenges CASCADE');
            await pool.query(`
                CREATE TABLE challenges (
                    id VARCHAR(100) PRIMARY KEY,
                    island_id VARCHAR(50) NOT NULL,
                    section_id VARCHAR(50) NOT NULL,
                    order_index INTEGER NOT NULL,
                    title VARCHAR(100) NOT NULL,
                    story_context TEXT,
                    description TEXT NOT NULL,
                    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
                    expected_output JSONB,
                    datasets JSONB,
                    hints JSONB DEFAULT '[]',
                    time_estimate INTEGER,
                    xp_reward INTEGER DEFAULT 50,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✓ Recreated challenges table with VARCHAR id');

            // Recreate foreign keys
            await pool.query(`
                ALTER TABLE user_progress ADD CONSTRAINT user_progress_challenge_id_fkey 
                FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
            `);
            await pool.query(`
                ALTER TABLE pvp_matches ADD CONSTRAINT pvp_matches_challenge_id_fkey 
                FOREIGN KEY (challenge_id) REFERENCES challenges(id)
            `);
            console.log('✓ Restored foreign key constraints');
        } else {
            console.log('✓ Table id is already VARCHAR');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}

main();
