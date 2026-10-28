const bcrypt = require('bcryptjs');
const pool = require('./db');

const DEMO_CREDENTIALS = [
  { username: 'alice', password: 'Alice-demo-2026' },
  { username: 'bob', password: 'Bob-demo-2026' },
  { username: 'admin', password: 'Admin-demo-2026' },
];

async function findActiveDemoCredentials() {
  const usernames = DEMO_CREDENTIALS.map((entry) => entry.username);
  const result = await pool.query(
    'SELECT username, password_hash FROM users WHERE username = ANY($1::text[])',
    [usernames]
  );

  const byUsername = new Map(result.rows.map((row) => [row.username, row.password_hash]));
  const active = [];
  for (const demo of DEMO_CREDENTIALS) {
    const hash = byUsername.get(demo.username);
    if (hash && (await bcrypt.compare(demo.password, hash))) active.push(demo.username);
  }
  return active;
}

async function assertNoDemoCredentials() {
  const active = await findActiveDemoCredentials();
  if (active.length) {
    throw new Error(`Credenciales demo activas: ${active.join(', ')}`);
  }
}

module.exports = { findActiveDemoCredentials, assertNoDemoCredentials };
