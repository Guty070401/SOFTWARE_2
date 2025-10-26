module.exports = (error, req, res, _next) => {
  const status = error.status || 500;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  res.status(status).json({
    error: error.message || 'Error interno del servidor'
  });
};
