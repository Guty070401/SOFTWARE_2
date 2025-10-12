// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();  // por si aún no se ha cargado
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];  // leer header Authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Autenticación requerida (falta token)' });
  }
  // El header esperado es "Bearer <token>"
  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }
  try {
    // Verificar y decodificar el token
    const payload = jwt.verify(token, JWT_SECRET);
    // Adjuntar info del usuario decodificado a la request
    req.user = payload;  // el payload contiene id, rol, etc. si así lo definimos al firmar
    next();  // token válido, continuar hacia el controlador
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = authMiddleware;
