// src/controllers/userController.js
const userService = require('../services/userService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const usuarios = await userService.getAllUsers();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const usuario = await userService.getUserById(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// ... métodos para actualizar o borrar usuario (según necesidades)
