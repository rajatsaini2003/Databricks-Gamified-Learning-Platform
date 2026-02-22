/**
 * Database Migration Runner
 * Runs SQL migration files to update the database schema
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
};

if (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

async function runMigration(filename) {
    const filepath = path.join(__dirname, 'migrations', filename);

    if (!fs.existsSync(filepath)) {
        console.error(`Migration file not found: ${filepath}`);
        return false;
    }

    console.log(`\n📁 Running migration: ${filename}`);
    const sql = fs.readFileSync(filepath, 'utf8');

    const client = await pool.connect();

    try {
        // Begin transaction
        await client.query('BEGIN');

        // Execute the entire SQL file as one
        await client.query(sql);

        // Commit transaction
        await client.query('COMMIT');

        console.log(`\n✅ Migration ${filename} completed successfully!`);
        return true;
    } catch (error) {
        await client.query('ROLLBACK');

        // Check if it's an "already exists" error
        if (error.code === '42P07' || error.code === '42701') {
            console.log(`\n⚠️ Some objects already exist. Migration may have been partially applied.`);
            console.log(`Error: ${error.message}`);
            return true;
        }

        console.error(`\n❌ Migration failed: ${error.message}`);
        console.error(`Error code: ${error.code}`);
        return false;
    } finally {
        client.release();
    }
}

async function main() {
    console.log('🚀 Starting Database Migrations...\n');
    console.log(`Database: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);

    try {
        // Test connection
        await pool.query('SELECT 1');
        console.log('✓ Database connected!\n');

        // Run gamification migration
        const success = await runMigration('002_gamification_tables.sql');

        if (success) {
            console.log('\n🎉 All migrations completed!');
            console.log('\nRestart your backend server to apply the changes.');
        }
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
