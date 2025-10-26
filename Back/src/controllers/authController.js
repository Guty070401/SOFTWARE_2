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
