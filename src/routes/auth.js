const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  const result = await pool.query(
    'SELECT id, username, password_hash, role FROM users WHERE username = $1',
    [username.trim().toLowerCase()]
  );
  const user = result.rows[0];
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  req.session.userId = user.id;
  req.session.save((err) => {
    if (err) return next(err);
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
