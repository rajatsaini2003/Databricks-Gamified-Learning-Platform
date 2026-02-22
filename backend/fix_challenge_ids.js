const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const challenges = [
    { old: 'sql_shore_1', new: 'shores_of_selection_1' },
    { old: 'sql_shore_2', new: 'shores_of_selection_2' },
    { old: 'sql_shore_3', new: 'shores_of_selection_3' },
    { old: 'sql_shore_4', new: 'shores_of_selection_4' },
    { old: 'sql_shore_5', new: 'shores_of_selection_5' },
    { old: 'sql_shore_6', new: 'join_junction_1' },
    { old: 'sql_shore_7', new: 'join_junction_2' },
    { old: 'sql_shore_8', new: 'aggregation_atoll_1' },
    { old: 'sql_shore_9', new: 'aggregation_atoll_2' },
    { old: 'sql_shore_10', new: 'aggregation_atoll_3' }
];

(async () => {
    try {
        console.log('🔄 Updating challenge IDs to match frontend...\n');

        for (const { old: oldId, new: newId } of challenges) {
            const result = await pool.query(
                'UPDATE challenges SET id = $1 WHERE id = $2 RETURNING id, title',
                [newId, oldId]
            );

            if (result.rows.length > 0) {
                console.log(`✅ Updated: ${oldId} → ${newId} (${result.rows[0].title})`);
            } else {
                console.log(`⚠️  Not found: ${oldId}`);
            }
        }

        console.log('\n✅ All challenge IDs updated successfully!');
        console.log('\n📋 Verifying new IDs:');

        const verify = await pool.query('SELECT id, title FROM challenges ORDER BY id LIMIT 10');
        verify.rows.forEach(c => console.log(`  - ${c.id}: ${c.title}`));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
})();
