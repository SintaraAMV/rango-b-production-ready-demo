const config = require('./src/config');
const pool = require('./src/db');
const { assertNoDemoCredentials } = require('./src/production-safety');

if (!config.databaseUrl) {
  console.error('Falta la variable de entorno DATABASE_URL');
  process.exit(1);
}

const app = require('./src/app');

let server;
let shuttingDown = false;

async function start() {
  if (config.env === 'production') await assertNoDemoCredentials();

  server = app.listen(config.port, () => {
    console.log(`TeamVault escuchando en el puerto ${config.port}`);
  });

  server.requestTimeout = 30000;
  server.headersTimeout = 35000;
  server.keepAliveTimeout = 5000;
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ type: 'shutdown', signal }));

  const forceTimer = setTimeout(() => process.exit(1), 10000);
  forceTimer.unref();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
  clearTimeout(forceTimer);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch(async (err) => {
  console.error(JSON.stringify({ type: 'startup_failed', message: err.message }));
  try { await pool.end(); } catch {}
  process.exit(1);
});
