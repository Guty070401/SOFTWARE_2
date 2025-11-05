const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../database/connection');
const { ALOE_EMAIL_REGEX } = require('../constants/user');

class Usuario extends Model {
  async changePassword(oldPassword, newPassword) {
    const matches = await this.verifyPassword(oldPassword);
    if (!matches) {
      return false;
    }
    this.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.save();
    return true;
  }

  verifyPassword(password) {
    if (!this.passwordHash) {
      return Promise.resolve(false);
    }
    return bcrypt.compare(password, this.passwordHash);
  }

  iniciarSesion() {
    this.activo = true;
    return this.save();
  }

  cerrarSesion() {
    this.activo = false;
    return this.save();
  }

  cambiarModo(nuevoRol) {
    this.rol = nuevoRol;
    return this.save();
  }

  setRole(rol) {
    this.rol = rol;
  }

  agregarOrden() {
    // handled through associations
  }

  agregarTarjeta() {
    // handled through associations
  }

  removerTarjeta() {
    // handled through associations
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

  static async createWithPassword({ password, ...rest }, options = {}) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.create({ ...rest, passwordHash }, options);
  }
}

Usuario.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombreUsuario: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'nombre_usuario'
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isAloeEmail(value) {
        if (!ALOE_EMAIL_REGEX.test(value)) {
          throw new Error('El correo debe seguir el formato 9 dígitos + @aloe.ulima.edu.pe');
        }
      }
    },
    set(value) {
      if (typeof value === 'string') {
        this.setDataValue('correo', value.toLowerCase());
      }
    }
  },
  celular: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rol: {
    type: DataTypes.ENUM('customer', 'courier', 'admin'),
    allowNull: false,
    defaultValue: 'customer'
  },
  solucion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Usuario',
  tableName: 'usuarios'
});

module.exports = Usuario;
