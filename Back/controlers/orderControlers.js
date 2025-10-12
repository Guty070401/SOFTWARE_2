// src/controllers/orderController.js
const orderService = require('../services/orderService');

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;  // asumimos que el middleware de auth agrega req.user
    const productos = req.body.productos; // array de { productoId, cantidad }
    const nuevaOrden = await orderService.createOrder(userId, productos);
    res.status(201).json(nuevaOrden);
  } catch (error) {
    next(error);
  }
};

exports.listOrders = async (req, res, next) => {
  try {
    // Si el rol es ADMIN, puede listar todas; si es USER, quizás solo las suyas:
    if (req.user.rol === 'ADMIN') {
      const ordenes = await orderService.getAllOrders();
      res.json(ordenes);
    } else {
      const ordenes = await orderService.getOrdersByUser(req.user.id);
      res.json(ordenes);
    }
  } catch (error) {
    next(error);
  }
};
