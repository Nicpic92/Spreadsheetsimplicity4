// /netlify/functions/_lib/database.js

const { Pool } = require('pg');

/**
 * This is the central connection pool for the entire application.
 * By centralizing it, we ensure that all serverless functions
 * share the same pool, which is more efficient and easier to manage.
 * 
 * It will automatically use the DATABASE_URL environment variable
 * when it's available in the Netlify hosting environment.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
