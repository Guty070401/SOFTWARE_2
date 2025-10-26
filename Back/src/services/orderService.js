const {
  ordenes,
  ordenUsuarios,
  ordenProductos,
  historialEstados,
  usuarios,
  tarjetas
} = require('../data/database');
const Orden = require('../models/Orden');
const OrdenUsuario = require('../models/OrdenUsuario');
const OrdenProducto = require('../models/OrdenProducto');
const HistorialEstado = require('../models/HistorialEstado');
const { ORDER_STATUS, ORDER_STATUS_FLOW, isValidOrderStatus } = require('../constants/orderStatus');
const authService = require('./authService');
const storeService = require('./storeService');

function requireUser(userId) {
  const user = authService.getUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return user;
}

function requireOrder(orderId) {
  const order = ordenes.get(orderId);
  if (!order) {
    const error = new Error('Orden no encontrada');
    error.status = 404;
    throw error;
  }
  return order;
}

function orderToDTO(order) {
  const store = storeService.getStore(order.tiendaId);
  const items = order.items.map((orderProduct) => {
    const product = storeService.getProduct(orderProduct.productoId);
    return {
      id: product ? product.id : orderProduct.productoId,
      name: product ? product.nombre : 'Producto',
      price: orderProduct.precioUnitario,
      quantity: orderProduct.cantidad,
      subtotal: orderProduct.subtotal(),
      image: product ? product.foto : null
    };
  });

  const history = historialEstados
    .filter((hist) => hist.ordenId === order.id)
    .map((hist) => hist.toJSON());

  return {
    id: order.id,
    tracking: order.tracking,
    status: order.estado,
    total: order.total,
    store: store ? store.toJSON() : null,
    items,
    history,
    direccionEntrega: order.direccionEntrega,
    comentarios: order.comentarios,
    createdAt: order.createdAt.toISOString()
  };
}

function userHasAccessToOrder(user, orderId) {
  if (user.rol === 'admin') {
    return true;
  }
  return ordenUsuarios.some((link) => link.usuarioId === user.id && link.ordenId === orderId);
}

function listOrdersForUser(user) {
  let orderIds;
  if (user.rol === 'courier') {
    orderIds = ordenUsuarios
      .filter((link) => link.usuarioId === user.id && link.esRepartidor)
      .map((link) => link.ordenId);
  } else if (user.rol === 'customer') {
    orderIds = ordenUsuarios
      .filter((link) => link.usuarioId === user.id && link.esPropietario)
      .map((link) => link.ordenId);
  } else {
    orderIds = Array.from(ordenes.keys());
  }

  return orderIds
    .map((orderId) => ordenes.get(orderId))
    .filter(Boolean)
    .map(orderToDTO);
}

function ensureCardBelongsToUser(user, cardId) {
  if (!cardId) {
    return null;
  }
  if (!user.tarjetas.has(cardId)) {
    const error = new Error('La tarjeta seleccionada no pertenece al usuario');
    error.status = 400;
    throw error;
  }
  return tarjetas.get(cardId) || null;
}

function findCourier() {
  return Array.from(usuarios.values()).find((user) => user.rol === 'courier') || null;
}

function createOrder({
  customerId,
  storeId,
  items,
  tarjetaId,
  direccionEntrega,
  comentarios
}) {
  const user = requireUser(customerId);
  const store = storeService.getStore(storeId);
  if (!store) {
    const error = new Error('Tienda no encontrada');
    error.status = 404;
    throw error;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Debe indicar al menos un producto');
    error.status = 400;
    throw error;
  }

  ensureCardBelongsToUser(user, tarjetaId);

  const order = new Orden({
    tiendaId: store.id,
    tarjetaId: tarjetaId || null,
    direccionEntrega: direccionEntrega || '',
    comentarios: comentarios || ''
  });

  items.forEach((item) => {
    const product = storeService.getProduct(item.productoId);
    if (!product) {
      const error = new Error(`Producto no encontrado: ${item.productoId}`);
      error.status = 404;
      throw error;
    }
    const cantidad = Number(item.cantidad) || 1;
    const orderProduct = new OrdenProducto({
      ordenId: order.id,
      productoId: product.id,
      cantidad,
      precioUnitario: product.precio
    });
    order.addItem(orderProduct);
    ordenProductos.push(orderProduct);
  });

  const initialHistory = new HistorialEstado({
    ordenId: order.id,
    estado: ORDER_STATUS.PENDING,
    comentarios: 'Pedido creado'
  });
  order.addHistorial(initialHistory);
  historialEstados.push(initialHistory);

  ordenes.set(order.id, order);

  const customerLink = new OrdenUsuario({
    ordenId: order.id,
    usuarioId: user.id,
    esPropietario: true
  });
  ordenUsuarios.push(customerLink);
  user.agregarOrden(order.id);

  const courier = findCourier();
  if (courier) {
    const courierLink = new OrdenUsuario({
      ordenId: order.id,
      usuarioId: courier.id,
      esRepartidor: true
    });
    ordenUsuarios.push(courierLink);
    courier.agregarOrden(order.id);
  }

  return orderToDTO(order);
}

function getOrderByIdForUser(orderId, user) {
  const order = requireOrder(orderId);
  if (!userHasAccessToOrder(user, orderId)) {
    const error = new Error('No tiene permisos para ver esta orden');
    error.status = 403;
    throw error;
  }
  return orderToDTO(order);
}

function validateStatusTransition(currentStatus, nextStatus) {
  if (nextStatus === ORDER_STATUS.CANCELED) {
    return true;
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const nextIndex = ORDER_STATUS_FLOW.indexOf(nextStatus);
  if (nextIndex === -1) {
    return false;
  }
  return nextIndex >= currentIndex;
}

function updateStatus(orderId, user, status, comentarios = '') {
  if (!isValidOrderStatus(status)) {
    const error = new Error('Estado de orden inválido');
    error.status = 400;
    throw error;
  }

  const order = requireOrder(orderId);

  if (!userHasAccessToOrder(user, orderId)) {
    const error = new Error('No tiene permisos para modificar esta orden');
    error.status = 403;
    throw error;
  }

  if (order.estado === status) {
    return orderToDTO(order);
  }

  if (!validateStatusTransition(order.estado, status)) {
    const error = new Error('La transición de estado no es válida');
    error.status = 400;
    throw error;
  }

  const history = new HistorialEstado({
    ordenId: order.id,
    estado: status,
    comentarios: comentarios || `Estado actualizado por ${user.nombreUsuario}`
  });
  order.addHistorial(history);
  historialEstados.push(history);

  if (status === ORDER_STATUS.DELIVERED) {
    order.solucion = true;
  }

  return orderToDTO(order);
}

module.exports = {
  createOrder,
  listOrdersForUser,
  getOrderByIdForUser,
  updateStatus,
  ORDER_STATUS
};
