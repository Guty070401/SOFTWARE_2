const { supabase } = require('../data/database');

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    ordenId: row.orden_id,
    usuarioId: row.usuario_id,
    rol: row.rol,
    mensaje: row.mensaje,
    createdAt: row.creado_en || row.created_at || row.createdAt,
  };
}

async function ensureAccess(orderId, userId) {
  const { data, error } = await supabase
    .from('orden_usuarios')
    .select('*')
    .eq('orden_id', orderId)
    .eq('usuario_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error('No autorizado para este pedido');
    err.status = 403;
    throw err;
  }
  return data;
}

async function listMessages(orderId, userId) {
  await ensureAccess(orderId, userId);
  const { data, error } = await supabase
    .from('orden_chat')
    .select('*')
    .eq('orden_id', orderId)
    .order('creado_en', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapMessage);
}

async function sendMessage(orderId, userId, mensaje, roleHint = null) {
  if (!mensaje || !mensaje.trim()) {
    const err = new Error('El mensaje es requerido');
    err.status = 400;
    throw err;
  }
  const link = await ensureAccess(orderId, userId);
  const roleNorm = roleHint ? String(roleHint).toLowerCase() : '';
  const messageRow = {
    orden_id: orderId,
    usuario_id: userId,
    rol: link.es_repartidor || roleNorm === 'courier' || roleNorm === 'repartidor' ? 'courier' : 'customer',
    mensaje: mensaje.trim(),
    creado_en: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('orden_chat')
    .insert(messageRow)
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data);
}

module.exports = {
  listMessages,
  sendMessage,
  ensureAccess,
  mapMessage,
};
