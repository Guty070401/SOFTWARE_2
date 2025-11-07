const express = require('express');
const storeController = require('../controllers/storeController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', storeController.listStores);
router.post('/', authMiddleware, storeController.createStore);
router.post('/:storeId/products', authMiddleware, storeController.createProduct);
router.delete('/:storeId', authMiddleware, storeController.deleteStore);
router.delete('/:storeId/products/:productId', authMiddleware, storeController.deleteProduct);

module.exports = router;
