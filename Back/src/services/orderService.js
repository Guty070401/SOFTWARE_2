const { Op } = require('sequelize');
const {
  sequelize,
  Orden,
  OrdenUsuario,
  OrdenProducto,
  HistorialEstado,
  Tarjeta,
  Usuario,
  Producto,
  Tienda
} = require('../models');
const { ORDER_STATUS, ORDER_STATUS_FLOW, isValidOrderStatus } = require('../constants/orderStatus');
const authService = require('./authService');
const storeService = require('./storeService');
const { generateId } = require('../utils/id');

const orderIncludes = [
  {
    model: OrdenProducto,
    as: 'items',
    include: [{ model: Producto, as: 'producto' }]
  },
  {
    model: HistorialEstado,
    as: 'historial'
  },
  {
    model: Tienda,
    as: 'tienda'
  },
  {
    model: Tarjeta,
    as: 'tarjeta'
  }
];

async function requireUser(userId) {
  const user = await authService.getUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return user;
}

async function loadOrder(orderId, transaction) {
  const order = await Orden.findByPk(orderId, {
    include: orderIncludes,
    transaction
  });
  if (!order) {
    const error = new Error('Orden no encontrada');
    error.status = 404;
    throw error;
  }
  return order;
}

function orderToDTO(order) {
  const store = storeService.mapStore(order.tienda, { includeItems: false });
  const items = (order.items || []).map((orderProduct) => {
    const product = orderProduct.producto;
    return {
      id: product ? product.id : orderProduct.productoId,
      name: product ? product.nombre : 'Producto',
      desc: product ? product.descripcion : '',
      image: product ? product.foto : null,
      price: Number(orderProduct.precioUnitario),
      qty: orderProduct.cantidad,
      subtotal: Number(orderProduct.subtotal().toFixed(2))
    };
  });

  const history = (order.historial || [])
    .sort((a, b) => new Date(a.hora) - new Date(b.hora))
    .map((hist) => ({
      id: hist.id,
      status: hist.estado,
      notes: hist.comentarios,
      timestamp: hist.hora instanceof Date ? hist.hora.toISOString() : new Date(hist.hora).toISOString()
    }));

  return {
    id: order.id,
    tracking: order.tracking,
    status: order.estado,
    total: Number(order.total),
    store,
    items,
    history,
    address: order.direccionEntrega,
    notes: order.comentarios,
    createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString()
  };
}

async function userHasAccessToOrder(user, orderId, transaction) {
  if (user.rol === 'admin') {
    return true;
  }

  const baseWhere = { ordenId: orderId, usuarioId: user.id };

  const where = user.rol === 'courier'
    ? { ...baseWhere, [Op.or]: [{ esRepartidor: true }, { esPropietario: true }] }
    : { ...baseWhere, esPropietario: true };

  const link = await OrdenUsuario.findOne({ where, transaction });
  return Boolean(link);
}

async function listOrdersForUser(user) {
  let orders;
  if (user.rol === 'admin') {
    orders = await Orden.findAll({ include: orderIncludes, order: [['created_at', 'DESC']] });
  } else {
    const where = user.rol === 'courier'
      ? { usuarioId: user.id, [Op.or]: [{ esRepartidor: true }, { esPropietario: true }] }
      : { usuarioId: user.id, esPropietario: true };

    const links = await OrdenUsuario.findAll({ where });
    const orderIds = links.map((link) => link.ordenId);
    if (!orderIds.length) {
      return [];
    }
    orders = await Orden.findAll({
      where: { id: orderIds },
      include: orderIncludes,
      order: [['created_at', 'DESC']]
    });
  }
  return orders.map(orderToDTO);
}

async function ensureCardBelongsToUser(user, cardId, transaction) {
  if (!cardId) {
    return null;
  }
  const card = await Tarjeta.findOne({ where: { id: cardId, usuarioId: user.id }, transaction });
  if (!card) {
    const error = new Error('La tarjeta seleccionada no pertenece al usuario');
    error.status = 400;
    throw error;
  }
  return card;
}

async function findCourier(transaction) {
  return Usuario.findOne({ where: { rol: 'courier' }, transaction, order: [['created_at', 'ASC']] });
}

async function createOrder({
  customerId,
  storeId,
  items,
  tarjetaId,
  direccionEntrega,
  comentarios
}) {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error('Debe incluir productos en la orden');
    error.status = 400;
    throw error;
  }

  const user = await requireUser(customerId);
  const store = await Tienda.findByPk(storeId);
  if (!store) {
    const error = new Error('Tienda no encontrada');
    error.status = 404;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    const card = await ensureCardBelongsToUser(user, tarjetaId, transaction);

    const order = await Orden.create({
      tracking: generateId('trk_'),
      tiendaId: store.id,
      tarjetaId: card ? card.id : null,
      direccionEntrega: direccionEntrega || '',
      comentarios: comentarios || '',
      total: 0
    }, { transaction });

    let total = 0;
    for (const item of items) {
      const product = await Producto.findOne({
        where: { id: item.productoId, tiendaId: store.id },
        transaction
      });
      if (!product) {
        const error = new Error(`Producto no encontrado: ${item.productoId}`);
        error.status = 404;
        throw error;
      }
      const cantidad = Number(item.cantidad) || 1;
      const precioUnitario = Number(product.precio);
      await OrdenProducto.create({
        ordenId: order.id,
        productoId: product.id,
        cantidad,
        precioUnitario
      }, { transaction });
      total += cantidad * precioUnitario;
    }

    order.total = Number(total.toFixed(2));
    await order.save({ transaction });

    await HistorialEstado.create({
      ordenId: order.id,
      estado: ORDER_STATUS.PENDING,
      comentarios: 'Pedido creado'
    }, { transaction });

    await OrdenUsuario.create({
      ordenId: order.id,
      usuarioId: user.id,
      esPropietario: true
    }, { transaction });

    const courier = await findCourier(transaction);
    if (courier) {
      await OrdenUsuario.create({
        ordenId: order.id,
        usuarioId: courier.id,
        esRepartidor: true
      }, { transaction });
    }

    await transaction.commit();

    const createdOrder = await loadOrder(order.id);
    return orderToDTO(createdOrder);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getOrderByIdForUser(orderId, user) {
  const order = await loadOrder(orderId);
  const hasAccess = await userHasAccessToOrder(user, orderId);
  if (!hasAccess) {
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

async function updateStatus(orderId, user, status, comentarios = '') {
  if (!isValidOrderStatus(status)) {
    const error = new Error('Estado de orden inválido');
    error.status = 400;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    const order = await loadOrder(orderId, transaction);
    const hasAccess = await userHasAccessToOrder(user, orderId, transaction);
    if (!hasAccess) {
      const error = new Error('No tiene permisos para modificar esta orden');
      error.status = 403;
      throw error;
    }

    if (order.estado === status) {
      await transaction.commit();
      const freshOrder = await loadOrder(orderId);
      return orderToDTO(freshOrder);
    }

    if (!validateStatusTransition(order.estado, status)) {
      const error = new Error('La transición de estado no es válida');
      error.status = 400;
      throw error;
    }

    order.estado = status;
    if (status === ORDER_STATUS.DELIVERED) {
      order.solucion = true;
    }
    await order.save({ transaction });

    await HistorialEstado.create({
      ordenId: order.id,
      estado: status,
      comentarios: comentarios || `Estado actualizado por ${user.nombreUsuario || user.id}`
    }, { transaction });

    await transaction.commit();

    const updatedOrder = await loadOrder(orderId);
    return orderToDTO(updatedOrder);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  createOrder,
  listOrdersForUser,
  getOrderByIdForUser,
  updateStatus,
  ORDER_STATUS
};
