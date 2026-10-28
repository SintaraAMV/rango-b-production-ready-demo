const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const path = require('path');
const config = require('./config');
const pool = require('./db');
const { requestContext, requestLog } = require('./middleware');
const { sendAlert } = require('./alerts');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');

const app = express();
if (config.env === 'production') app.set('trust proxy', 1);

app.use(requestContext);
app.use(express.json({ limit: '64kb' }));
app.use(requestLog);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  store: new PgSession({ pool, tableName: 'session' }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'teamvault.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (err) {
    await sendAlert({ type: 'readiness_failed', requestId: req.requestId });
    res.status(503).json({ status: 'not_ready' });
  }
});

app.use('/api', authRoutes);
app.use('/api/notes', notesRoutes.router);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use(async (err, req, res, next) => {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  console.error(JSON.stringify({
    type: 'error',
    requestId: req.requestId,
    status,
    message: err.message,
  }));
  if (status >= 500) await sendAlert({ type: 'server_error', requestId: req.requestId, status });
  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
    requestId: req.requestId,
  });
});

module.exports = app;
