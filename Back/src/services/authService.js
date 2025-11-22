// Back/src/services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { supabase } = require('../data/database');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

async function findByEmail(email) {
  const normalized = email.toLowerCase();
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('correo', normalized)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function buildTokenPayload(user) {
  return { id: user.id, rol: user.rol };
}

function toPublicUser(row) {
  return {
    id: row.id,
    nombre: row.nombre_usuario,
    correo: row.correo,
    celular: row.celular,
    foto: row.foto,
    rol: row.rol,
    solucion: row.solucion
  };
}

async function register({ nombre, correo, password, celular = '', rol = 'customer' }) {
  const existing = await findByEmail(correo);
  if (existing) {
    const err = new Error('El correo ya está registrado');
    err.status = 409;
    throw err;
  }

  const temp = await Usuario.createWithPassword({
    nombreUsuario: nombre,
    correo,
    password,
    celular,
    rol
  });

  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      id: temp.id,
      nombre_usuario: temp.nombreUsuario,
      correo: temp.correo,
      celular: temp.celular,
      password_hash: temp.passwordHash,
      foto: temp.foto,
      rol: temp.rol,
      solucion: temp.solucion
    })
    .select()
    .single();

  if (error) throw error;

  const token = jwt.sign(buildTokenPayload(data), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user: toPublicUser(data), token };
}

async function login({ correo, password }) {
  const user = await findByEmail(correo);
  if (!user) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const matches = await bcrypt.compare(password, user.password_hash).catch(() => false);
  if (!matches && password !== user.password_hash) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user: toPublicUser(user), token };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// 🔹 NUEVO: cambiar contraseña del usuario logueado
async function changePassword({ userId, oldPassword, newPassword }) {
  // 1. Buscar usuario
  const user = await getUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  // 2. Verificar contraseña actual contra password_hash
  const matches = await bcrypt.compare(oldPassword, user.password_hash).catch(() => false);
  if (!matches && oldPassword !== user.password_hash) {
    const err = new Error('Contraseña actual incorrecta');
    err.status = 400;
    throw err;
  }

  // 3. Hashear nueva contraseña y actualizar en Supabase
  const hashed = await bcrypt.hash(newPassword, 10);

  const { data, error } = await supabase
    .from('usuarios')
    .update({ password_hash: hashed })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;

  return toPublicUser(data);
}

module.exports = {
  register,
  login,
  verifyToken,
  getUserById,
  toPublicUser,
  changePassword, // 👈 importante
};
