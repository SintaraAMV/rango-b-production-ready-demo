const pool = require('./db');

async function requireAuth(req, res, next) {
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
}

module.exports = { requireAuth };
