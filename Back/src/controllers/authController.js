// Back/src/controllers/authController.js
const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const payload = {
      nombre: req.body.nombre ?? req.body.name,
      correo: req.body.correo ?? req.body.email,
      password: req.body.password ?? req.body.pass ?? '123456',
      celular: req.body.celular ?? req.body.phone ?? '',
      rol: req.body.rol ?? 'customer'
    };
    const result = await authService.register(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const credentials = {
      correo: req.body.correo ?? req.body.email,
      password: req.body.password ?? req.body.pass
    };
    const result = await authService.login(credentials);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 🔹 NUEVO: cambiar contraseña del usuario logueado
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.userId; // viene de requireAuth

    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    await authService.changePassword({ userId, oldPassword, newPassword });

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};
