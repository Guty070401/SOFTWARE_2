module.exports = (error, req, res, _next) => {
  const status = error.status || 500;
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
  res.status(status).json({
    error: error.message || 'Error interno del servidor'
  });
};
