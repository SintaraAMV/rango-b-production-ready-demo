const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.created_at, COUNT(n.id)::int AS note_count
         FROM users u LEFT JOIN notes n ON n.owner_id = u.id
        GROUP BY u.id ORDER BY u.id`
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/notes', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT n.id, n.title, n.body, n.updated_at, u.username AS owner
         FROM notes n JOIN users u ON u.id = n.owner_id
        ORDER BY n.updated_at DESC, n.id DESC`
    );
    res.json({ notes: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
