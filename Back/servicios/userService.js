// src/services/userService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

// Registro de un nuevo usuario
async function registerUser(data) {
  const { nombre, email, password, rol } = data;
  // Validar que email no exista ya
  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    throw new Error('El email ya está registrado');
  }
  // Hashear contraseña antes de guardar
  const saltRounds = 10;
  const passwordHash = bcrypt.hashSync(password, saltRounds);
  // Crear usuario en la base de datos
  const nuevoUsuario = await Usuario.create({
    nombre,
    email,
    password: passwordHash,
    rol: rol || 'USER'
  });
  return nuevoUsuario;
}

// Autenticación (login) de usuario
async function loginUser(email, password) {
  // Buscar usuario por email
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    throw new Error('Credenciales inválidas'); // email no encontrado
  }
  // Verificar password
  const passwordValida = bcrypt.compareSync(password, usuario.password);
  if (!passwordValida) {
    throw new Error('Credenciales inválidas'); // contraseña incorrecta
  }
  // Generar token JWT incluyendo datos útiles (id y rol)
  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES }
  );
  return token;
}

// Obtener todos los usuarios (ejemplo de servicio administrativo)
async function getAllUsers() {
  return await Usuario.findAll({
    attributes: { exclude: ['password'] }  // excluimos contraseña por seguridad
  });
}

// ...otros métodos como getUserById, updateUser, deleteUser, etc.

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  // ...exportar demás métodos
};
