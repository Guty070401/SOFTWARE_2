const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { usuarios } = require('../data/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

function findByEmail(email) {
  const normalized = email.toLowerCase();
  return Array.from(usuarios.values()).find((user) => user.correo === normalized) || null;
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

  if (findByEmail(correo)) {
    const error = new Error('El correo ya se encuentra registrado');
    error.status = 409;
    throw error;
  }

  const usuario = await Usuario.createWithPassword({
    nombreUsuario: nombre,
    correo,
    password,
    celular,
    rol
  });

  usuarios.set(usuario.id, usuario);

  const token = jwt.sign(buildTokenPayload(usuario), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { token, user: toPublicUser(usuario) };
}

async function login({ correo, password }) {
  const usuario = findByEmail(correo || '');
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

function getUserById(id) {
  return usuarios.get(id) || null;
}

module.exports = {
  register,
  login,
  verifyToken,
  getUserById,
  toPublicUser
};
