const crypto = require('crypto');
const pool = require('./db');

function requestContext(req, res, next) {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
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

async function requireAuth(req, res, next) {
  try {
    const userId = req.session && req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Debes iniciar sesión' });
    }
    const result = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Debes iniciar sesión' });
    }
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

module.exports = { requestContext, requestLog, requireAuth, requireAdmin };
