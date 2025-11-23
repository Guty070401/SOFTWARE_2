const authService = require('../services/authService');

module.exports = async (req, res, next) => {
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
    const maybeUser = authService.getUserById(payload.id);
    const setUser = (user) => {
      if (!user) {
        const error = new Error('Usuario no encontrado');
        error.status = 401;
        throw error;
      }
      req.user = { id: user.id, rol: user.rol };
      req.userEntity = user;
      next();
    };
    if (maybeUser && typeof maybeUser.then === 'function') {
      maybeUser.then(setUser).catch((error) => {
        error.status = error.status || 401;
        next(error);
      });
    } else {
      setUser(maybeUser);
    }
  } catch (error) {
    error.status = error.status || 401;
    next(error);
  }
};
