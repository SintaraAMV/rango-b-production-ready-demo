const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ quiet: true });

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Esquema creado');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('No se pudo crear el esquema:', err.message);
  process.exit(1);
});
