// src/middlewares/roleMiddleware.js
function roleMiddleware(rolesPermitidos = []) {
  return (req, res, next) => {
    const usuario = req.user;
    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: se requieren privilegios de ' + rolesPermitidos.join(' or ') });
    }
    next(); // el rol del usuario está autorizado
  };
}

module.exports = roleMiddleware;
