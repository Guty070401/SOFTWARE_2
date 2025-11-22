// Back/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Registro y login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Verificación de correo
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);

module.exports = router;
