// src/middlewares/errorMiddleware.js
function errorMiddleware(err, req, res, next) {
  console.error(err);  // Log del error para depuración (podría mejorarse con librerías de logging)

  // Si el error es conocido y tiene un status, lo usamos; sino, 500
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({ error: message });
}

module.exports = errorMiddleware;
