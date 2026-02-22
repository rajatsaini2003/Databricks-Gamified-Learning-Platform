const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkAndFixPvPChallenges() {
    const client = await pool.connect();

    try {
        console.log('=== PvP Challenges (difficulty >= 2) ===\n');

        // Get PvP challenges
        const challenges = await client.query(
            `SELECT id, title, description, expected_output, difficulty
       FROM challenges 
       WHERE difficulty >= 2 
       ORDER BY difficulty, title
       LIMIT 10`
        );

        challenges.rows.forEach((c, i) => {
            console.log(`${i + 1}. ${c.id}`);
            console.log(`   Title: ${c.title}`);
            console.log(`   Difficulty: ${c.difficulty}`);
            console.log(`   Desc: ${(c.description || '').substring(0, 150)}...`);
            console.log(`   Expected: ${JSON.stringify(c.expected_output)}`);
            console.log('');
        });

        // Update the first few challenges with proper expected_output for JOIN queries
        const updates = [
            {
                titlePattern: '%captain%ship%',
                expected: {
                    description: 'Join ships with captains to get ship and captain info',
                    requiresColumns: ['name'],
                    minRowCount: 1,
                    requiresJoin: true
                }
            },
            {
                titlePattern: '%join%',
                expected: {
                    description: 'Perform a JOIN operation',
                    minRowCount: 1,
                    requiresJoin: true
                }
            }
        ];

        console.log('\n=== Updating expected_output for JOIN challenges ===\n');

        // Find challenges with JOIN in description but no proper expected_output
        const joinChallenges = await client.query(
            `SELECT id, title, description, expected_output
       FROM challenges
       WHERE (LOWER(description) LIKE '%join%' OR LOWER(title) LIKE '%join%')
       AND difficulty >= 2
       LIMIT 5`
        );

        for (const challenge of joinChallenges.rows) {
            console.log(`Updating: ${challenge.id} - ${challenge.title}`);

            await client.query(
                `UPDATE challenges
         SET expected_output = $1
         WHERE id = $2`,
                [
                    JSON.stringify({
                        description: 'Join tables as specified',
                        minRowCount: 1,
                        requiresJoin: true,
                        // Simple validation: just needs rows
                    }),
                    challenge.id
                ]
            );
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAndFixPvPChallenges();
