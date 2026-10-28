const crypto = require('crypto');
const pool = require('./db');
const config = require('./config');

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LIMIT = 5;

function requestContext(req, res, next) {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  if (config.env === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

function requireSameOrigin(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();

  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== req.get('host')) {
      return res.status(403).json({ error: 'Origen no permitido' });
    }
  } catch {
    return res.status(403).json({ error: 'Origen no permitido' });
  }
  next();
}

function requestLog(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({
      type: 'http',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
      userId: req.user ? req.user.id : null,
    }));
  });
  next();
}

function loginRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || now - current.startedAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { startedAt: now, count: 1 });
    return next();
  }
  current.count += 1;
  if (current.count > LOGIN_LIMIT) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta nuevamente más tarde.' });
  }
  next();
}

function clearLoginRateLimit(req) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  loginAttempts.delete(key);
}

async function requireAuth(req, res, next) {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión' });
    const result = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Debes iniciar sesión' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = {
  requestContext,
  securityHeaders,
  requireSameOrigin,
  requestLog,
  loginRateLimit,
  clearLoginRateLimit,
  requireAuth,
  requireAdmin,
};
