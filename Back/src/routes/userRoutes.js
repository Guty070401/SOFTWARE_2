const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.get('/me/cards', userController.listCards);
router.post('/me/cards', userController.addCard);
router.delete('/me/cards/:cardId', userController.removeCard);
router.post('/me/change-password', userController.changePassword);

module.exports = router;
