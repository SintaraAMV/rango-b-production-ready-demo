const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

function validateNote(input) {
  const { title, body } = input || {};
  if (typeof title !== 'string' || title.trim().length === 0) return { error: 'El título es obligatorio', field: 'title' };
  if (title.trim().length > 200) return { error: 'El título no puede superar 200 caracteres', field: 'title' };
  if (body !== undefined && typeof body !== 'string') return { error: 'El contenido debe ser texto', field: 'body' };
  if (body && body.length > 5000) return { error: 'El contenido no puede superar 5000 caracteres', field: 'body' };
  return { value: { title: title.trim(), body: body || '' } };
}

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, owner_id, title, body, created_at, updated_at FROM notes WHERE owner_id = $1 ORDER BY updated_at DESC, id DESC',
      [req.user.id]
    );
    res.json({ notes: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, owner_id, title, body, created_at, updated_at FROM notes WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json({ note: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const parsed = validateNote(req.body);
  if (parsed.error) return res.status(400).json(parsed);
  try {
    const result = await pool.query(
      'INSERT INTO notes (owner_id, title, body) VALUES ($1, $2, $3) RETURNING id, owner_id, title, body, created_at, updated_at',
      [req.user.id, parsed.value.title, parsed.value.body]
    );
    res.status(201).json({ note: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  const parsed = validateNote(req.body);
  if (parsed.error) return res.status(400).json(parsed);
  try {
    const result = await pool.query(
      `UPDATE notes SET title = $1, body = $2, updated_at = now()
       WHERE id = $3 AND owner_id = $4
       RETURNING id, owner_id, title, body, created_at, updated_at`,
      [parsed.value.title, parsed.value.body, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json({ note: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Nota no encontrada' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = { router, validateNote };
