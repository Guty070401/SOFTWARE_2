const authService = require('../services/authService');

module.exports = function requireAdmin(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    const payload = authService.verifyToken(token);
    if (!payload?.id) return res.status(401).json({ message: 'Invalid token' });
    req.userId = payload.id;
    req.userRole = payload.rol;
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch (e) {
    return res.status(401).json({ message: e.message });
  }
};
