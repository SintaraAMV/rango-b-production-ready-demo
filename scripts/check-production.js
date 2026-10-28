const { assertNoDemoCredentials } = require('../src/production-safety');
const pool = require('../src/db');

assertNoDemoCredentials()
  .then(async () => {
    console.log('Production safety check PASS');
    await pool.end();
  })
  .catch(async (err) => {
    console.error(`Production safety check FAIL: ${err.message}`);
    try { await pool.end(); } catch {}
    process.exit(1);
  });
