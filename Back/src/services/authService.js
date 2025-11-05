const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { ALOE_EMAIL_REGEX } = require('../constants/user');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

async function findByEmail(email) {
  const normalized = (email || '').toLowerCase();
  if (!normalized) {
    return null;
  }
  return Usuario.findOne({ where: { correo: normalized } });
}

function buildTokenPayload(user) {
  return {
    id: user.id,
    rol: user.rol
  };
}

function toPublicUser(user) {
  return user.toPublicJSON();
}

async function register({ nombre, correo, password, celular = '', rol = 'customer' }) {
  if (!nombre || !correo || !password) {
    const error = new Error('Nombre, correo y contraseña son obligatorios');
    error.status = 400;
    throw error;
  }

  const normalizedCorreo = String(correo).toLowerCase();
  if (!ALOE_EMAIL_REGEX.test(normalizedCorreo)) {
    const error = new Error('El correo debe seguir el formato 9 dígitos + @aloe.ulima.edu.pe');
    error.status = 400;
    throw error;
  }

  const existing = await findByEmail(normalizedCorreo);
  if (existing) {
    const error = new Error('El correo ya se encuentra registrado');
    error.status = 409;
    throw error;
  }

  const usuario = await Usuario.createWithPassword({
    nombreUsuario: nombre,
    correo: normalizedCorreo,
    password,
    celular,
    rol
  });

  const token = jwt.sign(buildTokenPayload(usuario), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { token, user: toPublicUser(usuario) };
}

async function login({ correo, password }) {
  const usuario = await findByEmail(correo);
  if (!usuario) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const matches = await usuario.verifyPassword(password || '');
  if (!matches) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(buildTokenPayload(usuario), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { token, user: toPublicUser(usuario) };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function getUserById(id) {
  if (!id) {
    return null;
  }
  return Usuario.findByPk(id);
}

module.exports = {
  register,
  login,
  verifyToken,
  getUserById,
  toPublicUser
};
