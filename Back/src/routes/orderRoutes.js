const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', orderController.listOrders);
router.post('/', roleMiddleware(['customer', 'admin']), orderController.createOrder);
router.get('/:orderId', orderController.getOrder);
router.patch('/:orderId/status', roleMiddleware(['courier', 'admin']), orderController.updateStatus);

module.exports = router;
