// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const router = express.Router();

// Rutas de usuario (necesitan autenticación y algunas requieren rol admin)
router.get('/', auth, role(['ADMIN']), userController.getAllUsers);      // solo admin puede listar usuarios
router.get('/:id', auth, role(['ADMIN']), userController.getUserById);   // solo admin puede ver detalle de cualquier usuario
// (Podríamos agregar una ruta para que el propio usuario vea su perfil sin ser admin)

module.exports = router;
