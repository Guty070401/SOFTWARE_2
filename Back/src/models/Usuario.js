const crypto = require('crypto');
const { generateId } = require('../utils/id');

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hashed] = storedHash.split(':');
  if (!salt || !hashed) {
    return false;
  }

  const derivedBuffer = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );

  const storedBuffer = Buffer.from(hashed, 'hex');

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

class Usuario {
  constructor({
    id = generateId('usr_'),
    nombreUsuario,
    correo,
    celular = '',
    passwordHash,
    foto = null,
    rol = 'customer',
    solucion = false
  }) {
    this.id = id;
    this.nombreUsuario = nombreUsuario;
    this.correo = correo.toLowerCase();
    this.celular = celular;
    this.passwordHash = passwordHash;
    this.foto = foto;
    this.rol = rol;
    this.solucion = Boolean(solucion);
    this.ordenes = new Set();
    this.tarjetas = new Set();
    this.activo = true;
  }

  static async createWithPassword({ password, ...rest }) {
    const passwordHash = hashPassword(password);
    return new Usuario({ ...rest, passwordHash });
  }

  async changePassword(oldPassword, newPassword) {
    const matches = await this.verifyPassword(oldPassword);
    if (!matches) {
      return false;
    }
    this.passwordHash = hashPassword(newPassword);
    return true;
  }

  async verifyPassword(password) {
    if (!this.passwordHash) {
      return false;
    }
    return verifyPassword(password, this.passwordHash);
  }

  iniciarSesion() {
    this.activo = true;
  }

  cerrarSesion() {
    this.activo = false;
  }

  cambiarModo(nuevoRol) {
    this.rol = nuevoRol;
  }

  setRole(rol) {
    this.rol = rol;
  }

  agregarOrden(ordenId) {
    this.ordenes.add(ordenId);
  }

  agregarTarjeta(tarjetaId) {
    this.tarjetas.add(tarjetaId);
  }

  removerTarjeta(tarjetaId) {
    this.tarjetas.delete(tarjetaId);
  }

  toPublicJSON() {
    return {
      id: this.id,
      nombre: this.nombreUsuario,
      correo: this.correo,
      celular: this.celular,
      foto: this.foto,
      rol: this.rol,
      solucion: this.solucion
    };
  }
}

module.exports = Usuario;
