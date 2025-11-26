const bcrypt = require('../utils/bcrypt');
const { generateId } = require('../utils/id');

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
    const passwordHash = await bcrypt.hash(password, 10);
    return new Usuario({ ...rest, passwordHash });
  }

  async changePassword(oldPassword, newPassword) {
    const matches = await this.verifyPassword(oldPassword);
    if (!matches) {
      return false;
    }
    this.passwordHash = await bcrypt.hash(newPassword, 10);
    return true;
  }

  async verifyPassword(password) {
    if (!this.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, this.passwordHash);
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
