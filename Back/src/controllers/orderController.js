const orderService = require('../services/orderService');

function normaliseItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    productoId: item.productoId ?? item.productId ?? item.id,
    cantidad: Number(item.cantidad ?? item.qty ?? item.quantity ?? 1),
    precio: Number(item.precio ?? item.price ?? 0),
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
    const storeId = req.body.storeId ?? req.body.tiendaId;
    const items = normaliseItems(req.body.items);

    if (!storeId) {
      return res.status(400).json({ error: 'storeId es requerido' });
    }
    if (!items.length) {
      return res.status(400).json({ error: 'items no puede estar vacío' });
    }
    for (const it of items) {
      if (!it.productoId) {
        return res.status(400).json({ error: 'Cada item debe tener productoId' });
      }
      if (it.cantidad <= 0) {
        return res.status(400).json({ error: 'cantidad debe ser > 0' });
      }
      if (Number.isNaN(it.precio)) {
        return res.status(400).json({ error: 'precio inválido en item' });
      }
    }

    const payload = {
      customerId: req.userEntity?.id,
      storeId,
      items,
      tarjetaId: req.body.tarjetaId ?? req.body.cardId ?? null,
      direccionEntrega: req.body.direccion ?? req.body.direccionEntrega ?? req.body.address ?? null,
      comentarios: req.body.comentarios ?? req.body.notes ?? null,
    };

    const order = await orderService.createOrder(payload);

    res.status(201).json({ order });
  } catch (error) {
    console.error('[orders.create] ', error);
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByIdForUser(
      req.params.orderId,
      req.userEntity
    );
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
      req.body.notes ?? req.body.mensaje ?? 'ok'
    );
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(
      req.params.orderId,
      req.userEntity
    );
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
