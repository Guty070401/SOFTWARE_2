// src/controllers/authController.js
const userService = require('../services/userService');

// Registro de nuevo usuario
exports.register = async (req, res, next) => {
  try {
    const nuevoUsuario = await userService.registerUser(req.body);
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: { 
        id: nuevoUsuario.id, 
        nombre: nuevoUsuario.nombre, 
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol 
      }
    });
  } catch (error) {
    next(error);  // delega el error al middleware de manejo de errores
  }
};

// Login de usuario (autenticación)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await userService.loginUser(email, password);
    res.json({
      message: 'Autenticación exitosa',
      token: token
    });
  } catch (error) {
    next(error);
  }
};
