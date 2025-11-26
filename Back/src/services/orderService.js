// Back/src/services/orderService.js  (CommonJS)
const { supabase } = require('../data/database');
const { randomUUID } = require('node:crypto');
const Orden = require('../models/Orden');
const OrdenUsuario = require('../models/OrdenUsuario');
const OrdenProducto = require('../models/OrdenProducto');
const HistorialEstado = require('../models/HistorialEstado');
const { ORDER_STATUS, ORDER_STATUS_FLOW, isValidOrderStatus } = require('../constants/orderStatus');
const authService = require('./authService');
const storeService = require('./storeService');
const emailService = require('./emailService');

const STATUS_ALIAS_MAP = new Map([
  ['created',   ORDER_STATUS.PENDING],
  ['pending',   ORDER_STATUS.PENDING],
  ['pendiente', ORDER_STATUS.PENDING],
  ['accepted',  ORDER_STATUS.ACCEPTED],
  ['aceptado',  ORDER_STATUS.ACCEPTED],
  ['picked',    ORDER_STATUS.PICKED],
  ['recogido',  ORDER_STATUS.PICKED],
  ['on_route',  ORDER_STATUS.ON_ROUTE],
  ['en_camino', ORDER_STATUS.ON_ROUTE],
  ['delivered', ORDER_STATUS.DELIVERED],
  ['entregado', ORDER_STATUS.DELIVERED],
  ['canceled',  ORDER_STATUS.CANCELED],
  ['cancelled', ORDER_STATUS.CANCELED],
  ['cancelado', ORDER_STATUS.CANCELED],
]);

function normalizeStatusValue(value) {
  if (!value) return null;
  const key = String(value).toLowerCase().replace(/\s+/g, '_');
  return STATUS_ALIAS_MAP.get(key) || null;
}

function orderToDTO(orderRow, items = [], store = null) {
  const mappedItems = (items || []).map((it) => {
    const unit = Number(it.precio_unitario ?? it.precio ?? 0);
    const qty  = Number(it.cantidad ?? it.qty ?? 1);
    return {
      id: it.id,
      productoId: it.producto_id,
      cantidad: qty,
      qty,
      precioUnitario: unit,
      precio: unit,
      price: unit,
    };
  });

  const total = mappedItems.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);

  return {
    id: orderRow.id,
    tracking: orderRow.tracking,
    fecha: orderRow.fecha,
    hora: orderRow.hora,
    status: orderRow.estado,
    estado: orderRow.estado,
    solucion: orderRow.solucion,
    tiempoEstimado: orderRow.tiempo_estimado,
    tienda: store ? { id: store.id, nombre: store.nombre, logo: store.logo } : undefined,
    direccionEntrega: orderRow.direccion_entrega,
    comentarios: orderRow.comentarios,
    items: mappedItems,
    total,
  };
}

async function listOrdersForUser(userId) {
  const { data: links, error: errLinks } = await supabase
    .from('orden_usuarios')
    .select('orden_id')
    .eq('usuario_id', userId)
    .eq('es_propietario', true);
  if (errLinks) throw errLinks;
  if (!links || !links.length) return [];

  const orderIds = links.map((l) => l.orden_id);

  const { data: orders, error: errOrders } = await supabase
    .from('ordenes')
    .select('*')
    .in('id', orderIds)
    .order('hora', { ascending: false });
  if (errOrders) throw errOrders;

  const { data: items, error: errItems } = await supabase
    .from('orden_productos')
    .select('*')
    .in('orden_id', orderIds);
  if (errItems) throw errItems;

  const { data: stores, error: errStores } = await supabase
    .from('tiendas')
    .select('*');
  if (errStores) throw errStores;

  const storesMap = new Map(
    (stores || []).map((s) => [s.id, { id: s.id, nombre: s.nombre_origen ?? s.nombre, logo: s.logo }])
  );

  const itemsByOrder = (items || []).reduce((acc, it) => {
    acc[it.orden_id] ||= [];
    acc[it.orden_id].push(it);
    return acc;
  }, {});

  return orders.map((o) => orderToDTO(o, itemsByOrder[o.id] || [], storesMap.get(o.tienda_id) || null));
}

async function createOrder(userId, { storeId, items, tarjetaId, direccionEntrega, comentarios }) {
  const user = await authService.getUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  const store = await storeService.getStore(storeId);
  if (!store) {
    const error = new Error('Tienda no encontrada');
    error.status = 404;
    throw error;
  }

  if (tarjetaId) {
    const { data: card, error: errCard } = await supabase
      .from('tarjetas')
      .select('id, usuario_id, invalidada')
      .eq('id', tarjetaId)
      .maybeSingle();
    if (errCard) throw errCard;
    if (!card || card.usuario_id !== userId || card.invalidada) {
      const error = new Error('Tarjeta invalida o no pertenece al usuario');
      error.status = 400;
      throw error;
    }
  }

  const order = new Orden({
    tiendaId: store.id,
    tarjetaId: tarjetaId || null,
    direccionEntrega: direccionEntrega || '',
    comentarios: comentarios || '',
  });
  order.id = randomUUID();

  const itemsToInsert = [];
  for (const it of items) {
    const cantidad = Number(it.cantidad) || 1;
    const precioUnitario = Number(it.precio ?? it.price ?? it.precioUnitario ?? 0);
    if (Number.isNaN(precioUnitario)) {
      const error = new Error(`Precio invalido para el producto: ${it.productoId}`);
      error.status = 400;
      throw error;
    }
    const op = new OrdenProducto({
      ordenId: order.id,
      productoId: it.productoId,
      cantidad,
      precioUnitario,
    });
    const opRowId = randomUUID();
    itemsToInsert.push({
      id: opRowId,
      orden_id: op.ordenId,
      producto_id: op.productoId,
      cantidad: op.cantidad,
      precio_unitario: op.precioUnitario,
    });
  }

  const { data: insertedOrder, error: errOrder } = await supabase
    .from('ordenes')
    .insert({
      id: order.id,
      tracking: order.tracking,
      fecha: order.fecha.toISOString().slice(0, 10),
      hora: order.hora.toISOString().slice(11, 19),
      estado: order.estado,
      solucion: order.solucion,
      tiempo_estimado: order.tiempoEstimado,
      tienda_id: order.tiendaId,
      tarjeta_id: order.tarjetaId,
      direccion_entrega: order.direccionEntrega,
      comentarios: order.comentarios,
    })
    .select()
    .single();
  if (errOrder) throw errOrder;

  const owner = new OrdenUsuario({
    ordenId: order.id,
    usuarioId: user.id,
    esPropietario: true,
    esRepartidor: false,
  });
  const ownerRowId = randomUUID();

  const { error: errLink } = await supabase.from('orden_usuarios').insert({
    id: ownerRowId,
    orden_id: owner.ordenId,
    usuario_id: owner.usuarioId,
    es_propietario: owner.esPropietario,
    es_repartidor: owner.esRepartidor,
  });
  if (errLink) throw errLink;

  if (itemsToInsert.length) {
    const { error: errItems } = await supabase.from('orden_productos').insert(itemsToInsert);
    if (errItems) throw errItems;
  }

  const he = new HistorialEstado({
    ordenId: order.id,
    estado: insertedOrder.estado,
    comentarios: insertedOrder.comentarios,
    hora: new Date(),
  });

  const histRowId = randomUUID();
  const { error: errHist } = await supabase.from('historial_estados').insert({
    id: histRowId,
    orden_id: he.ordenId,
    estado: he.estado,
    comentarios: he.comentarios,
    hora: he.hora.toISOString(),
  });
  if (errHist) throw errHist;

  return await getOrderByIdForUser(order.id, userId);
}

async function getOrderByIdForUser(orderId, userId) {
  const { data: link, error: errLink } = await supabase
    .from('orden_usuarios')
    .select('*')
    .eq('orden_id', orderId)
    .eq('usuario_id', userId)
    .maybeSingle();
  if (errLink) throw errLink;
  if (!link) {
    const e = new Error('No tienes acceso a esta orden');
    e.status = 403;
    throw e;
  }

  const { data: o, error: errO } = await supabase
    .from('ordenes')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (errO) throw errO;
  if (!o) {
    const e = new Error('Orden no encontrada');
    e.status = 404;
    throw e;
  }

  const { data: items, error: errItems } = await supabase
    .from('orden_productos')
    .select('*')
    .eq('orden_id', orderId);
  if (errItems) throw errItems;

  const store = await storeService.getStore(o.tienda_id);
  return orderToDTO(o, items, store);
}

async function updateStatus(orderId, status) {
  const nextStatus = normalizeStatusValue(status);
  if (!nextStatus || !isValidOrderStatus(nextStatus)) {
    const e = new Error('Estado no valido');
    e.status = 400;
    throw e;
  }

  const { data: o, error: errO } = await supabase
    .from('ordenes')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (errO) throw errO;
  if (!o) {
    const e = new Error('Orden no encontrada');
    e.status = 404;
    throw e;
  }

  const currentStatus = normalizeStatusValue(o.estado);
  const allowedNext = ORDER_STATUS_FLOW[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    const e = new Error(`Transicion invalida de ${o.estado} a ${nextStatus}`);
    e.status = 400;
    throw e;
  }

  const solucion = nextStatus === ORDER_STATUS.DELIVERED ? true : o.solucion;

  const { data: updated, error: errUpd } = await supabase
    .from('ordenes')
    .update({ estado: nextStatus, solucion })
    .eq('id', orderId)
    .select()
    .single();
  if (errUpd) throw errUpd;

  const he = new HistorialEstado({
    ordenId: orderId,
    estado: nextStatus,
    comentarios: '',
    hora: new Date(),
  });
  const statusHistRowId = randomUUID();
  const { error: errHist } = await supabase.from('historial_estados').insert({
    id: statusHistRowId,
    orden_id: he.ordenId,
    estado: he.estado,
    comentarios: he.comentarios,
    hora: he.hora.toISOString(),
  });
  if (errHist) throw errHist;

  const { data: items, error: errItems } = await supabase
    .from('orden_productos')
    .select('*')
    .eq('orden_id', orderId);
  if (errItems) throw errItems;

  const store = await storeService.getStore(updated.tienda_id);

  // Notificaciones de correo
  const total = (items || []).reduce((s, it) => s + Number(it.precio_unitario || 0) * Number(it.cantidad || 0), 0);
  const monto = total.toFixed(2);
  const isCard = !!updated.tarjeta_id;

  let owner = null;
  try {
    const { data: linkOwner } = await supabase
      .from('orden_usuarios')
      .select('usuario_id')
      .eq('orden_id', orderId)
      .eq('es_propietario', true)
      .maybeSingle();
    if (linkOwner?.usuario_id) owner = await authService.getUserById(linkOwner.usuario_id);
  } catch (e) {
    console.error('[email] owner fetch', e);
  }

  let repartidorNombre = null;
  try {
    const { data: linkCourier } = await supabase
      .from('orden_usuarios')
      .select('usuario_id')
      .eq('orden_id', orderId)
      .eq('es_repartidor', true)
      .limit(1)
      .maybeSingle();
    if (linkCourier?.usuario_id) {
      const courier = await authService.getUserById(linkCourier.usuario_id);
      repartidorNombre = courier?.nombre_usuario || courier?.nombre || null;
    }
  } catch (e) {
    console.error('[email] courier fetch', e);
  }

  try {
    if (updated.estado === ORDER_STATUS.ACCEPTED && !isCard && owner?.correo) {
      await emailService.sendCashAcceptedEmail({
        to: owner.correo,
        nombre: owner.nombre_usuario || owner.nombre,
        monto,
        repartidor: repartidorNombre,
        orderId,
      });
    }
    if (updated.estado === ORDER_STATUS.DELIVERED && owner?.correo) {
      if (isCard) {
        await emailService.sendCardChargedEmail({
          to: owner.correo,
          nombre: owner.nombre_usuario || owner.nombre,
          monto,
          orderId,
        });
      } else {
        await emailService.sendCashDeliveredEmail({
          to: owner.correo,
          nombre: owner.nombre_usuario || owner.nombre,
          monto,
          orderId,
        });
      }
    }
  } catch (e) {
    console.error('[email] order status', e);
  }

  return orderToDTO(updated, items, store);
}

async function cancelOrder(orderId, userId) {
  // Verificar que el usuario sea propietario de la orden
  const { data: link, error: errLink } = await supabase
    .from('orden_usuarios')
    .select('es_propietario')
    .eq('orden_id', orderId)
    .eq('usuario_id', userId)
    .maybeSingle();
  if (errLink) throw errLink;
  if (!link || !link.es_propietario) {
    const e = new Error('No tienes permisos para cancelar esta orden');
    e.status = 403;
    throw e;
  }

  const { data: orderRow, error: errOrder } = await supabase
    .from('ordenes')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (errOrder) throw errOrder;
  if (!orderRow) {
    const e = new Error('Orden no encontrada');
    e.status = 404;
    throw e;
  }

  const currentStatus = normalizeStatusValue(orderRow.estado);
  if (currentStatus === ORDER_STATUS.DELIVERED) {
    const e = new Error('No se puede cancelar una orden ya entregada');
    e.status = 400;
    throw e;
  }
  if (currentStatus === ORDER_STATUS.CANCELED) {
    return getOrderByIdForUser(orderId, userId);
  }

  const allowedCancel = ORDER_STATUS_FLOW[currentStatus] || [];
  if (!allowedCancel.includes(ORDER_STATUS.CANCELED)) {
    const e = new Error('La orden no se puede cancelar en su estado actual');
    e.status = 400;
    throw e;
  }

  const { data: updated, error: errUpdate } = await supabase
    .from('ordenes')
    .update({ estado: ORDER_STATUS.CANCELED, solucion: false })
    .eq('id', orderId)
    .select()
    .single();
  if (errUpdate) throw errUpdate;

  const historial = new HistorialEstado({
    ordenId: orderId,
    estado: ORDER_STATUS.CANCELED,
    comentarios: 'cancelada por el cliente',
    hora: new Date(),
  });
  const histRowId = randomUUID();
  const { error: errHist } = await supabase.from('historial_estados').insert({
    id: histRowId,
    orden_id: historial.ordenId,
    estado: historial.estado,
    comentarios: historial.comentarios,
    hora: historial.hora.toISOString(),
  });
  if (errHist) throw errHist;

  const { data: items, error: errItems } = await supabase
    .from('orden_productos')
    .select('*')
    .eq('orden_id', orderId);
  if (errItems) throw errItems;

  const store = await storeService.getStore(updated.tienda_id);
  return orderToDTO(updated, items, store);
}

module.exports = {
  createOrder,
  listOrdersForUser,
  getOrderByIdForUser,
  updateStatus,
  cancelOrder,
  ORDER_STATUS,
};
