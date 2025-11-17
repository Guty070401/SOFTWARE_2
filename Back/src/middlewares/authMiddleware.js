const authService = require('../services/authService');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      const error = new Error('No autorizado');
      error.status = 401;
      throw error;
    }

    const payload = authService.verifyToken(token);
    const user = await authService.getUserById(payload.id);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 401;
      throw error;
    }

    req.userEntity = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    error.status = error.status || 401;
    next(error);
  }
};
