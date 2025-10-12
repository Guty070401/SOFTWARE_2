// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// En authRoutes.js, antes de authController.register
const { body } = require('express-validator');

router.post('/register', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('El password debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().withMessage('El nombre es requerido')
], 
async (req, res, next) => {
  // middleware para manejar resultado de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Enviar errores de validación al cliente
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}, authController.register);

// Rutas de autenticación (públicas)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
