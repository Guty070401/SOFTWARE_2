module.exports = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    const error = new Error('Autenticación requerida');
    error.status = 401;
    return next(error);
  }
  if (allowedRoles.length && !allowedRoles.includes(req.user.rol)) {
    const error = new Error('No tiene permisos para realizar esta acción');
    error.status = 403;
    return next(error);
  }
  next();
};
