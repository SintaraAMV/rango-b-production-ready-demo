require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';
const sessionSecret = process.env.SESSION_SECRET;
const databaseSsl = process.env.DATABASE_SSL === 'true';
const databaseSslRejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

if (env === 'production' && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error('SESSION_SECRET es obligatorio en producción y debe tener al menos 32 caracteres');
}
if (env === 'production' && !databaseSsl) {
  throw new Error('DATABASE_SSL=true es obligatorio en producción');
}

module.exports = {
  env,
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl,
  databaseSslRejectUnauthorized,
  sessionSecret: sessionSecret || 'development-only-session-secret-change-me',
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || '',
};
