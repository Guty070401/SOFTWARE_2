// Back/src/middlewares/requireAuth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.rol || payload.role || 'customer';
    next();
  } catch (e) {
    return res.status(401).json({ message: e.message || 'Unauthorized' });
  }
};
