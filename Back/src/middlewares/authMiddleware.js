const authService = require('../services/authService');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : req.cookies?.token;

  if (!token) {
    const error = new Error('Autenticación requerida');
    error.status = 401;
    return next(error);
  }

  try {
    const payload = authService.verifyToken(token);
    const user = authService.getUserById(payload.id);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 401;
      throw error;
    }
    req.user = { id: user.id, rol: user.rol };
    req.userEntity = user;
    next();
  } catch (error) {
    error.status = error.status || 401;
    next(error);
  }
};
