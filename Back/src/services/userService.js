const { Tarjeta } = require('../models');
const authService = require('./authService');

async function requireUser(userId) {
  const user = await authService.getUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return user;
}

async function getProfile(userId) {
  const user = await requireUser(userId);
  return authService.toPublicUser(user);
}

async function updateProfile(userId, { nombre, celular, foto, rol }) {
  const user = await requireUser(userId);
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
    user.rol = rol;
  }
  await user.save();
  return authService.toPublicUser(user);
}

async function listCards(userId) {
  await requireUser(userId);
  const cards = await Tarjeta.findAll({
    where: { usuarioId: userId },
    order: [['created_at', 'ASC']]
  });
  return cards.map((card) => card.toJSON());
}

async function addCard(userId, payload) {
  await requireUser(userId);
  if (!payload.numeroTarjeta || !payload.csv) {
    const error = new Error('Los datos de la tarjeta son incompletos');
    error.status = 400;
    throw error;
  }
  const vencimiento = payload.vencimiento instanceof Date
    ? payload.vencimiento
    : new Date(payload.vencimiento);
  if (Number.isNaN(vencimiento.getTime())) {
    const error = new Error('La fecha de vencimiento es inválida');
    error.status = 400;
    throw error;
  }
  const card = await Tarjeta.create({
    usuarioId: userId,
    numeroTarjeta: payload.numeroTarjeta,
    vencimiento,
    csv: payload.csv,
    titulo: payload.titulo || '',
    foto: payload.foto || null
  });
  return card.toJSON();
}

async function removeCard(userId, cardId) {
  await requireUser(userId);
  const card = await Tarjeta.findOne({ where: { id: cardId, usuarioId: userId } });
  if (!card) {
    const error = new Error('La tarjeta no pertenece al usuario');
    error.status = 404;
    throw error;
  }
  await card.destroy();
}

module.exports = {
  getProfile,
  updateProfile,
  listCards,
  addCard,
  removeCard
};
