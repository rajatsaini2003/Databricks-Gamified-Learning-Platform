const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function updatePvPValidation() {
    const client = await pool.connect();

    try {
        console.log('Updating challenge expected_output for PvP validation...\n');

        // Update "Captains & Their Ships" challenge with proper validation
        const captainsAndShips = await client.query(
            `UPDATE challenges 
       SET expected_output = $1
       WHERE id = $2
       RETURNING id, title`,
            [
                JSON.stringify({
                    requiresColumns: ['ship_name', 'captain_name', ' rank'],
                    minRowCount: 1,
                    description: 'Must join ships and captains tables, showing ship_name, captain_name, and rank columns'
                }),
                'shores_of_selection_1' // Update this to match your actual challenge ID
            ]
        );

        if (captainsAndShips.rows.length > 0) {
            console.log('✓ Updated:', captainsAndShips.rows[0].title);
        } else {
            console.log('⚠ Challenge not found with ID: shores_of_selection_1');
            console.log('  Trying to find JOIN challenges...\n');

            // Find JOIN-related challenges
            const joinChallenges = await client.query(
                `SELECT id, title, description 
         FROM challenges 
         WHERE LOWER(description) LIKE '%join%' 
            OR LOWER(title) LIKE '%join%'
            OR LOWER(description) LIKE '%captain%'
         LIMIT 5`
            );

            console.log('Found potential JOIN challenges:');
            joinChallenges.rows.forEach(ch => {
                console.log(`  - ${ch.id}: ${ch.title}`);
            });

            if (joinChallenges.rows.length > 0) {
                // Update the first one as an example
                const firstChallenge = joinChallenges.rows[0];
                await client.query(
                    `UPDATE challenges 
           SET expected_output = $1
           WHERE id = $2`,
                    [
                        JSON.stringify({
                            requiresColumns: ['ship_name', 'captain_name', 'rank'],
                            minRowCount: 1,
                            description: 'Must join ships and captains, showing ship name, captain name, and rank'
                        }),
                        firstChallenge.id
                    ]
                );
                console.log(`\n✓ Updated ${firstChallenge.id} with validation criteria`);
            }
        }

        // Update other common challenge patterns
        const selectChallenges = await client.query(
            `SELECT id, title 
       FROM challenges 
       WHERE LOWER(description) LIKE '%select%' 
         AND (expected_output IS NULL OR expected_output = '{}')
       LIMIT 10`
        );

        for (const challenge of selectChallenges.rows) {
            await client.query(
                `UPDATE challenges
         SET expected_output = $1
         WHERE id = $2`,
                [
                    JSON.stringify({
                        minRowCount: 1,
                        description: 'Must return at least one row'
                    }),
                    challenge.id
                ]
            );
            console.log(`✓ Set basic validation for: ${challenge.title}`);
        }

        console.log('\n✅ Validation criteria updated successfully!');

    } catch (error) {
        console.error('Error updating validation:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updatePvPValidation();
