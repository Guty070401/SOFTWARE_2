const Tarjeta = require('../models/Tarjeta');
const { tarjetas } = require('../data/database');
const authService = require('./authService');

function requireUser(userId) {
  const user = authService.getUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return user;
}

function getProfile(userId) {
  const user = requireUser(userId);
  return authService.toPublicUser(user);
}

function updateProfile(userId, { nombre, celular, foto, rol }) {
  const user = requireUser(userId);
  if (nombre) {
    user.nombreUsuario = nombre;
  }
  if (typeof celular === 'string') {
    user.celular = celular;
  }
  if (typeof foto === 'string' || foto === null) {
    user.foto = foto;
  }
  if (rol && rol !== user.rol) {
    user.setRole(rol);
  }
  return authService.toPublicUser(user);
}

function listCards(userId) {
  const user = requireUser(userId);
  return Array.from(user.tarjetas).map((cardId) => {
    const card = tarjetas.get(cardId);
    return card ? card.toJSON() : null;
  }).filter(Boolean);
}

function addCard(userId, payload) {
  const user = requireUser(userId);
  const card = new Tarjeta(payload);
  tarjetas.set(card.id, card);
  user.agregarTarjeta(card.id);
  return card.toJSON();
}

function removeCard(userId, cardId) {
  const user = requireUser(userId);
  if (!user.tarjetas.has(cardId)) {
    const error = new Error('La tarjeta no pertenece al usuario');
    error.status = 404;
    throw error;
  }
  user.removerTarjeta(cardId);
  tarjetas.delete(cardId);
}

module.exports = {
  getProfile,
  updateProfile,
  listCards,
  addCard,
  removeCard
};
