// src/routes/productRoutes.js
const express = require('express');
const productController = require('../controllers/productController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const router = express.Router();

// Lista de productos (pública o autenticada según requiera la app; aquí supongamos cualquiera autenticado puede ver)
router.get('/', auth, productController.listProducts);
// Crear nuevo producto (solo admin, por ejemplo)
router.post('/', auth, role(['ADMIN']), productController.createProduct);

module.exports = router;
