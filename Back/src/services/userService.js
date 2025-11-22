const bcrypt = require('bcrypt');
const { supabase } = require('../data/database');
const Tarjeta = require('../models/Tarjeta');
const authService = require('./authService');

async function requireUser(userId) {
  const row = await authService.getUserById(userId);
  if (!row) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return row;
}

async function getProfile(userId) {
  const row = await requireUser(userId);
  return authService.toPublicUser(row);
}

async function updateProfile(userId, payload) {
  await requireUser(userId);
  const updates = {};
  if (payload.nombre) updates.nombre_usuario = payload.nombre;
  if (payload.celular !== undefined) updates.celular = payload.celular;
  if (payload.foto !== undefined) updates.foto = payload.foto;

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return authService.toPublicUser(data);
}

async function listCards(userId) {
  await requireUser(userId);
  const { data, error } = await supabase
    .from('tarjetas')
    .select('*')
    .eq('usuario_id', userId);
  if (error) throw error;
  return data;
}

async function addCard(userId, payload) {
  await requireUser(userId);
  const card = new Tarjeta(payload);
  const { data, error } = await supabase
    .from('tarjetas')
    .insert({
      id: card.id,
      usuario_id: userId,
      numero_tarjeta: card.numeroTarjeta,
      vencimiento: card.vencimiento.toISOString().slice(0, 10),
      csv: card.csv,
      titulo: card.titulo,
      foto: card.foto,
      invalidada: card.invalidada
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function removeCard(userId, cardId) {
  await requireUser(userId);
  const { error } = await supabase
    .from('tarjetas')
    .delete()
    .eq('id', cardId)
    .eq('usuario_id', userId);
  if (error) throw error;
}

async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await requireUser(userId);
  if (!oldPassword || !newPassword) {
    const err = new Error('oldPassword y newPassword son requeridos');
    err.status = 400;
    throw err;
  }
  let matches = false;
  if (!user.password_hash) {
    matches = true; // permite establecer contraseña si no hay previa (compatibilidad)
  } else {
    try { matches = await bcrypt.compare(oldPassword, user.password_hash); } catch (_) {}
    if (!matches && user.password_hash === oldPassword) matches = true; // fallback plano
  }
  if (!matches) {
    const err = new Error('La contraseña actual no coincide');
    err.status = 401;
    throw err;
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from('usuarios')
    .update({ password_hash: newHash })
    .eq('id', userId);
  if (error) throw error;
}

module.exports = {
  getProfile,
  updateProfile,
  listCards,
  addCard,
  removeCard,
  changePassword
};
