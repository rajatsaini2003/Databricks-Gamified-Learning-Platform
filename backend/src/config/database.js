require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let isDemoMode = false;

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Use SSL in production or if explicitly requested
if (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

try {
  pool = new Pool(poolConfig);

  pool.on('connect', () => {
    console.log('✅ Connected to the PostgreSQL database!');
    isDemoMode = false;
  });

  pool.on('error', (err) => {
    console.error('⚠️ Database connection error:', err.message);
    console.log('🔄 Switching to DEMO MODE - using mock data');
    isDemoMode = true;
  });

  // Test connection immediately
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      console.error('⚠️ Cannot connect to database:', err.message);
      console.log('🔄 Running in DEMO MODE - no database required');
      isDemoMode = true;
    }
  });
} catch (error) {
  console.error('⚠️ Database initialization failed:', error.message);
  console.log('🔄 Running in DEMO MODE - no database required');
  isDemoMode = true;
}

// Safe query function that handles demo mode
const safeQuery = async (text, params) => {
  if (isDemoMode || !pool) {
    throw new Error('DATABASE_UNAVAILABLE');
  }
  return pool.query(text, params);
};

module.exports = {
  query: safeQuery,
  pool,
  isDemoMode: () => isDemoMode,
};