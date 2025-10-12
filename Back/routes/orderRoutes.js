// src/routes/orderRoutes.js
const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const router = express.Router();

// Crear una nueva orden (debe estar autenticado cualquier usuario)
router.post('/', auth, role(['USER','ADMIN']), orderController.createOrder);
// Listar órdenes (admin ve todas, usuario ve propias; la lógica está en el controlador)
router.get('/', auth, orderController.listOrders);

module.exports = router;
