const express = require('express');
const storeController = require('../controllers/storeController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', storeController.listStores);
router.post('/', authMiddleware, storeController.createStore);
router.post('/:storeId/products', authMiddleware, storeController.createProduct);

module.exports = router;
