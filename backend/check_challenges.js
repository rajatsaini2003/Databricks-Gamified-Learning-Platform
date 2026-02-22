const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_0iSGeMbzno8V@ep-raspy-voice-ahwa6vpn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const result = await pool.query('SELECT id, title, island_id, section_id FROM challenges ORDER BY id LIMIT 10');
        console.log('\n✅ First 10 challenges in database:');
        result.rows.forEach(c => {
            console.log(`  ID: "${c.id}" | Island: ${c.island_id} | Section: ${c.section_id}`);
            console.log(`      Title: ${c.title}`);
        });
        console.log(`\n Total challenges: ${result.rows.length}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
})();
