// Back/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./data/database');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
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

module.exports = app;
