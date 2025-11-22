// Back/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

// Registro y login
router.post('/register', authController.register);
router.post('/login', authController.login);

// 🔹 Cambiar contraseña (requiere estar logueado)
router.post(
  '/change-password',
  requireAuth,
  authController.changePassword
);

module.exports = router;
