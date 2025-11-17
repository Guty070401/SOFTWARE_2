module.exports = function roleMiddleware(allowedRoles = []) {
  return (req, _res, next) => {
    const userRole = req.userEntity?.rol;
    if (!userRole || (allowedRoles.length && !allowedRoles.includes(userRole))) {
      const error = new Error('No tiene permisos para acceder a este recurso');
      error.status = 403;
      return next(error);
    }
    next();
  };
};
