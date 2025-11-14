// src/controllers/orderController.js
const orderService = require('../services/orderService');

/**
 * Normaliza items recibidos desde el front para que el servicio
 * siempre reciba: { productoId, cantidad, precio }
 */
function normaliseItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    productoId: item.productoId ?? item.productId ?? item.id,
    cantidad: Number(item.cantidad ?? item.qty ?? item.quantity ?? 1),
    precio: Number(item.precio ?? item.price ?? 0),
  }));
}

/** Lista de órdenes del usuario autenticado */
exports.listOrders = async (req, res, next) => {
  try {
    const orders = await orderService.listOrdersForUser(req.userEntity);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una orden:
 * - valida storeId e items
 * - asegura que los items tengan precio/cantidad
 * - agrega 'hora' con fecha/hora local (ISO) para quien lo necesite
 *   (si la BD ya tiene DEFAULT now(), igual no estorba)
 */
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
    // Valida cada item
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

    // Datos adicionales coherentes
    const payload = {
      customerId: req.userEntity?.id,
      storeId,
      items,
      tarjetaId: req.body.tarjetaId ?? req.body.cardId ?? null,
      direccionEntrega: req.body.direccion ?? req.body.direccionEntrega ?? req.body.address ?? null,
      comentarios: req.body.comentarios ?? req.body.notes ?? null,
    };

    const order = await orderService.createOrder(payload);

    // created
    res.status(201).json({ order });
  } catch (error) {
    // Log útil para depurar fallos de FK/NOT NULL en Supabase
    console.error('[orders.create] ', error);
    next(error);
  }
};

/** Obtiene una orden del usuario autenticado */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderByIdForUser(req.params.orderId, req.userEntity);
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el estado de la orden.
 * Si tu servicio registra historial, allí se insertará en historial_estados
 * (incluye comentarios opcionales).
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(
      req.params.orderId,
      req.userEntity,
      req.body.status,
      req.body.comentarios ?? req.body.notes ?? null
    );
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
