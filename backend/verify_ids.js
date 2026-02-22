const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const result = await pool.query(`
      SELECT id, section_id, title 
      FROM challenges 
      WHERE id LIKE '%selection%' OR id LIKE '%junction%' OR id LIKE '%atoll%'
      ORDER BY id
    `);

        console.log('\n✅ Updated Challenge IDs:');
        console.log('─'.repeat(80));
        result.rows.forEach(c => {
            console.log(`${c.id.padEnd(30)} | ${c.section_id.padEnd(20)} | ${c.title}`);
        });
        console.log('─'.repeat(80));
        console.log(`Total: ${result.rows.length} challenges\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
})();
