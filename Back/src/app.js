// Back/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./data/database');

const app = express();

const corsEnv = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsEnv
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '');

app.use(cors({
  origin(origin, callback) {
    const cleanedOrigin = normalizeOrigin(origin);

    if (!cleanedOrigin || allowedOrigins.includes('*') || allowedOrigins.includes(cleanedOrigin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origin no permitido: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200
}));
app.use(express.json());

// 🔎 Logger simple de requests/responses
app.use((req, res, next) => {
  const t0 = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`, req.body && Object.keys(req.body).length ? req.body : '');
  res.on('finish', () => console.log(`[RES] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - t0}ms)`));
  next();
});

// ⚙️ Rutas de tu API (deja como ya las tienes montadas)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/catalog', require('./routes/catalogRoutes'));

// 🧪 Ruta de diagnóstico (quítala luego de probar)
app.get('/debug/db', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('tiendas').select('id').limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Error handler en formato JSON para que el front reciba mensajes legibles
app.use((err, _req, res, next) => {
  console.error('[ERR]', err);
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  const message =
    err.message ||
    err.error?.message ||
    err.error_description ||
    'Error';
  const payload = { message };
  if (process.env.NODE_ENV !== 'production') {
    const details = err.details || err.detail;
    if (details) payload.details = details;
  }
  res.status(status).json(payload);
});

module.exports = app;
