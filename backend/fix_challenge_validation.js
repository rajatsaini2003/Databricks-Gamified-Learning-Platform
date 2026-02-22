const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function fixChallengeValidation() {
    const client = await pool.connect();

    try {
        console.log('Fixing challenge #1 validation criteria...\n');

        // Find the first challenge (The Harbor Manifest)
        const challenges = await client.query(
            `SELECT id, title, description, expected_output 
       FROM challenges 
       WHERE LOWER(title) LIKE '%harbor%' OR LOWER(title) LIKE '%manifest%'
       LIMIT 5`
        );

        console.log('Found challenges:');
        challenges.rows.forEach(c => {
            console.log(`  - ${c.id}: ${c.title}`);
            console.log(`    Current expected_output:`, c.expected_output);
        });

        if (challenges.rows.length > 0) {
            const firstChallenge = challenges.rows[0];

            // Update with correct validation for "SELECT * FROM ships"
            await client.query(
                `UPDATE challenges 
         SET expected_output = $1
         WHERE id = $2`,
                [
                    JSON.stringify({
                        description: 'Must select all columns from ships table',
                        requiresTable: 'ships',
                        minRowCount: 1,
                        // No JOIN required, no specific columns required
                        allowSelectStar: true
                    }),
                    firstChallenge.id
                ]
            );

            console.log(`\n✅ Updated challenge "${firstChallenge.title}" with correct validation`);
            console.log('   Expected: SELECT * FROM ships;');
        }

        // Also check if there are challenges with wrong expected_output
        const wrongValidation = await client.query(
            `SELECT id, title, description, expected_output
       FROM challenges
       WHERE expected_output::text LIKE '%captain_name%'
         AND description NOT LIKE '%join%'
         AND description NOT LIKE '%captain%'
       LIMIT 5`
        );

        if (wrongValidation.rows.length > 0) {
            console.log('\n⚠️  Found challenges with JOIN validation but no JOIN in description:');
            wrongValidation.rows.forEach(c => {
                console.log(`  - ${c.id}: ${c.title}`);
            });
        }

        console.log('\n✅ Validation fix complete!');

    } catch (error) {
        console.error('Error fixing validation:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixChallengeValidation();
