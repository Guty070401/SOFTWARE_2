const orderService = require('../services/orderService');

function normaliseItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => ({
    productoId: item.productoId ?? item.productId ?? item.id,
    cantidad: item.cantidad ?? item.qty ?? item.quantity ?? 1
  }));
}

exports.listOrders = async (req, res, next) => {
  try {
    const orders = await orderService.listOrdersForUser(req.userEntity);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder({
      customerId: req.userEntity.id,
      storeId: req.body.storeId ?? req.body.tiendaId,
      items: normaliseItems(req.body.items),
      tarjetaId: req.body.tarjetaId ?? req.body.cardId,
      direccionEntrega: req.body.direccion ?? req.body.direccionEntrega ?? req.body.address,
      comentarios: req.body.comentarios ?? req.body.notes
    });
    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByIdForUser(req.params.orderId, req.userEntity);
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(
      req.params.orderId,
      req.userEntity,
      req.body.status,
      req.body.comentarios ?? req.body.notes
    );
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
