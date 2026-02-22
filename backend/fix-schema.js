require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixSchema() {
    console.log('🔧 Fixing database schema issues...\n');

    try {
        // 1. Check and fix user_progress.challenge_id type
        console.log('1. Checking user_progress.challenge_id type...');
        const upCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_progress' AND column_name = 'challenge_id'
        `);

        if (upCols.rows.length > 0 && upCols.rows[0].data_type === 'uuid') {
            console.log('   ⚠️  user_progress.challenge_id is UUID, converting to VARCHAR...');
            await pool.query(`ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_challenge_id_fkey`);
            await pool.query(`DELETE FROM user_progress`); // Clear old UUID data
            await pool.query(`ALTER TABLE user_progress ALTER COLUMN challenge_id TYPE VARCHAR(100)`);
            await pool.query(`
                ALTER TABLE user_progress 
                ADD CONSTRAINT user_progress_challenge_id_fkey 
                FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
            `);
            console.log('   ✓ Converted user_progress.challenge_id to VARCHAR');
        } else {
            console.log('   ✓ user_progress.challenge_id is already VARCHAR');
        }

        // 2. Check and fix pvp_matches.challenge_id type
        console.log('\n2. Checking pvp_matches.challenge_id type...');
        const pvpCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pvp_matches' AND column_name = 'challenge_id'
        `);

        if (pvpCols.rows.length > 0 && pvpCols.rows[0].data_type === 'uuid') {
            console.log('   ⚠️  pvp_matches.challenge_id is UUID, converting to VARCHAR...');
            await pool.query(`ALTER TABLE pvp_matches DROP CONSTRAINT IF EXISTS pvp_matches_challenge_id_fkey`);
            await pool.query(`DELETE FROM pvp_matches`); // Clear old UUID data
            await pool.query(`ALTER TABLE pvp_matches ALTER COLUMN challenge_id TYPE VARCHAR(100)`);
            await pool.query(`
                ALTER TABLE pvp_matches 
                ADD CONSTRAINT pvp_matches_challenge_id_fkey 
                FOREIGN KEY (challenge_id) REFERENCES challenges(id)
            `);
            console.log('   ✓ Converted pvp_matches.challenge_id to VARCHAR');
        } else {
            console.log('   ✓ pvp_matches.challenge_id is already VARCHAR');
        }

        // 3. Check achievements table structure
        console.log('\n3. Checking achievements table...');
        const achCols = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'achievements'
        `);

        const colNames = achCols.rows.map(r => r.column_name);
        console.log('   Columns found:', colNames);

        if (!colNames.includes('badge_id')) {
            console.log('   ⚠️  badge_id column missing, adding it...');
            await pool.query(`ALTER TABLE achievements ADD COLUMN IF NOT EXISTS badge_id VARCHAR(50)`);
            console.log('   ✓ Added badge_id column');
        } else {
            console.log('   ✓ badge_id column exists');
        }

        // 4. Verify challenges table
        console.log('\n4. Verifying challenges table...');
        const chCount = await pool.query('SELECT COUNT(*) FROM challenges');
        console.log(`   ✓ Challenges count: ${chCount.rows[0].count}`);

        console.log('\n✅ Schema fixes complete!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        pool.end();
    }
}

fixSchema();
