const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Error en cliente inactivo de PostgreSQL:', err.message);
});

module.exports = pool;
