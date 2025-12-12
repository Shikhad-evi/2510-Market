const { Pool } = require('pg');

const client = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/market"
});

module.exports = client;
