const chatService = require('../services/chatService');

async function listChat(req, res, next) {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const messages = await chatService.listMessages(orderId, userId);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function sendChat(req, res, next) {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const roleHint = req.userRole || req.user?.rol || req.user?.role || null;
    const { message } = req.body || {};
    const saved = await chatService.sendMessage(orderId, userId, message, roleHint);
    res.status(201).json({ message: saved });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listChat,
  sendChat,
};
