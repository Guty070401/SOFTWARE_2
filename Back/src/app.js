require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./data/database');

const app = express();

// =========================================================
// 🚀 SOLUCIÓN DEFINITIVA DE CORS
// =========================================================
// En lugar de validar manualmente el origen, usamos "origin: true"
// Esto le dice al navegador: "Copia el origen de la petición y acéptalo".
// Es la forma más robusta de evitar errores de coincidencia de strings.
app.use(cors({
  origin: true,            // Acepta dinámicamente el origen que venga
  credentials: true,       // Permite enviar headers de autorización (JWT)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Habilitamos explícitamente las respuestas a peticiones "OPTIONS" (pre-flight)
// Esto evita el error rojo de "Response to preflight request doesn't pass..."
app.options('*', cors());
// =========================================================

app.use(express.json());

// 🔎 Logger simple de requests/responses
app.use((req, res, next) => {
  const t0 = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`, req.body && Object.keys(req.body).length ? req.body : '');
  res.on('finish', () => console.log(`[RES] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - t0}ms)`));
  next();
});

// ⚙️ Rutas de tu API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/catalog', require('./routes/catalogRoutes'));

// 🧪 Ruta de diagnóstico
app.get('/debug/db', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('tiendas').select('id').limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Error handler
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
