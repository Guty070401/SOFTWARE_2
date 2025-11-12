// Back/src/services/orderService.js  (CommonJS)
const { supabase } = require('../data/database');
const Orden = require('../models/Orden');
const OrdenUsuario = require('../models/OrdenUsuario');
const OrdenProducto = require('../models/OrdenProducto');
const HistorialEstado = require('../models/HistorialEstado');
const { ORDER_STATUS, ORDER_STATUS_FLOW, isValidOrderStatus } = require('../constants/orderStatus');
const authService = require('./authService');
const storeService = require('./storeService');

function orderToDTO(orderRow, items = [], store = null) {
  const total = items.reduce((s, it) => s + Number(it.precio_unitario) * Number(it.cantidad), 0);
  return {
    id: orderRow.id,
    tracking: orderRow.tracking,
    fecha: orderRow.fecha,
    hora: orderRow.hora,
    estado: orderRow.estado,
    solucion: orderRow.solucion,
    tiempoEstimado: orderRow.tiempo_estimado,
    tienda: store ? { id: store.id, nombre: store.nombre, logo: store.logo } : undefined,
    direccionEntrega: orderRow.direccion_entrega,
    comentarios: orderRow.comentarios,
    items: items.map(it => ({
      id: it.id,
      productoId: it.producto_id,
      cantidad: it.cantidad,
      precioUnitario: Number(it.precio_unitario)
    })),
    total
  };
}

async function listOrdersForUser(userId) {
  const { data: links, error: errLinks } = await supabase
    .from('orden_usuarios')
    .select('orden_id')
    .eq('usuario_id', userId)
    .eq('es_propietario', true);
  if (errLinks) throw errLinks;

  if (!links.length) return [];

  const orderIds = links.map(l => l.orden_id);
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

  const { data: stores, error: errStores } = await supabase.from('tiendas').select('*');
  if (errStores) throw errStores;
  const storesMap = new Map(stores.map(s => [s.id, { id: s.id, nombre: s.nombre_origen, logo: s.logo }]));

  const itemsByOrder = items.reduce((acc, it) => {
    acc[it.orden_id] ||= [];
    acc[it.orden_id].push(it);
    return acc;
  }, {});

  return orders.map(o => orderToDTO(o, itemsByOrder[o.id] || [], storesMap.get(o.tienda_id) || null));
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
      const error = new Error('Tarjeta inválida o no pertenece al usuario');
      error.status = 400;
      throw error;
    }
  }

  const order = new Orden({
    tiendaId: store.id,
    tarjetaId: tarjetaId || null,
    direccionEntrega: direccionEntrega || '',
    comentarios: comentarios || ''
  });

  const itemsToInsert = [];
  for (const it of items) {
    const product = await storeService.getProduct(it.productoId);
    if (!product || product.tiendaId !== store.id) {
      const error = new Error(`Producto no encontrado o no pertenece a la tienda: ${it.productoId}`);
      error.status = 404;
      throw error;
    }
    const cantidad = Number(it.cantidad) || 1;
    const op = new OrdenProducto({
      ordenId: order.id,
      productoId: product.id,
      cantidad,
      precioUnitario: product.precio
    });
    itemsToInsert.push({
      id: op.id,
      orden_id: op.ordenId,
      producto_id: op.productoId,
      cantidad: op.cantidad,
      precio_unitario: op.precioUnitario
    });
  }

  const { data: insertedOrder, error: errOrder } = await supabase
    .from('ordenes')
    .insert({
      id: order.id,
      tracking: order.tracking,
      fecha: order.fecha.toISOString().slice(0, 10),
      hora: order.hora.toISOString(),
      estado: order.estado,
      solucion: order.solucion,
      tiempo_estimado: order.tiempoEstimado,
      tienda_id: order.tiendaId,
      tarjeta_id: order.tarjetaId,
      direccion_entrega: order.direccionEntrega,
      comentarios: order.comentarios
    })
    .select()
    .single();
  if (errOrder) throw errOrder;

  const owner = new OrdenUsuario({
    ordenId: order.id,
    usuarioId: user.id,
    esPropietario: true,
    esRepartidor: false
  });

  const { error: errLink } = await supabase.from('orden_usuarios').insert({
    id: owner.id,
    orden_id: owner.ordenId,
    usuario_id: owner.usuarioId,
    es_propietario: owner.esPropietario,
    es_repartidor: owner.esRepartidor
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
    hora: new Date(insertedOrder.hora)
  });

  const { error: errHist } = await supabase.from('historial_estados').insert({
    id: he.id,
    orden_id: he.ordenId,
    estado: he.estado,
    comentarios: he.comentarios,
    hora: he.hora.toISOString()
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

  const { data: o, error: errO } = await supabase.from('ordenes').select('*').eq('id', orderId).maybeSingle();
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
  if (!isValidOrderStatus(status)) {
    const e = new Error('Estado no válido');
    e.status = 400;
    throw e;
  }

  const { data: o, error: errO } = await supabase.from('ordenes').select('*').eq('id', orderId).maybeSingle();
  if (errO) throw errO;
  if (!o) {
    const e = new Error('Orden no encontrada');
    e.status = 404;
    throw e;
  }

  const allowedNext = ORDER_STATUS_FLOW[o.estado] || [];
  if (!allowedNext.includes(status)) {
    const e = new Error(`Transición inválida de ${o.estado} a ${status}`);
    e.status = 400;
    throw e;
  }

  const solucion = status === ORDER_STATUS.DELIVERED ? true : o.solucion;

  const { data: updated, error: errUpd } = await supabase
    .from('ordenes')
    .update({ estado: status, solucion })
    .eq('id', orderId)
    .select()
    .single();
  if (errUpd) throw errUpd;

  const he = new HistorialEstado({
    ordenId: orderId,
    estado: status,
    comentarios: '',
    hora: new Date()
  });
  const { error: errHist } = await supabase.from('historial_estados').insert({
    id: he.id,
    orden_id: he.ordenId,
    estado: he.estado,
    comentarios: he.comentarios,
    hora: he.hora.toISOString()
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
  ORDER_STATUS
};
