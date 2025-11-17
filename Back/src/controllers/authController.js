const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register({
      nombre: req.body.nombre,
      correo: req.body.correo || req.body.email,
      password: req.body.password,
      celular: req.body.telefono || req.body.celular || req.body.phone || ''
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login({
      correo: req.body.correo || req.body.email,
      password: req.body.password
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
