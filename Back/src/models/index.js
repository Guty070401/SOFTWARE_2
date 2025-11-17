const { Sequelize, DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

const DB_NAME = process.env.DB_NAME || 'app_db';
const DB_USER = process.env.DB_USER || 'user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  storage: DB_DIALECT === 'sqlite' ? process.env.DB_STORAGE || 'database.sqlite' : undefined,
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true
  }
});

class Usuario extends Model {
  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  toPublicJSON() {
    return {
      id: this.id,
      nombre: this.nombreUsuario,
      correo: this.correo,
      celular: this.celular || '',
      foto: this.foto || null,
      rol: this.rol
    };
  }

  static async createWithPassword({ nombreUsuario, correo, password, celular = '', foto = null, rol = 'customer' }) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.create({ nombreUsuario, correo, passwordHash, celular, foto, rol });
  }
}

Usuario.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombreUsuario: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nombre_usuario'
  },
  correo: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  celular: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rol: {
    type: DataTypes.ENUM('customer', 'courier', 'admin'),
    allowNull: false,
    defaultValue: 'customer'
  }
}, {
  sequelize,
  modelName: 'Usuario',
  tableName: 'usuarios'
});

class Tarjeta extends Model {}
Tarjeta.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'usuario_id'
  },
  numeroTarjeta: {
    type: DataTypes.STRING(32),
    allowNull: false,
    field: 'numero_tarjeta'
  },
  vencimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  csv: {
    type: DataTypes.STRING(8),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Tarjeta',
  tableName: 'tarjetas'
});

class Tienda extends Model {}
Tienda.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombreOrigen: {
    type: DataTypes.STRING(120),
    allowNull: false,
    field: 'nombre_origen'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Tienda',
  tableName: 'tiendas'
});

class Producto extends Model {}
Producto.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tiendaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tienda_id'
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Producto',
  tableName: 'productos'
});

class Orden extends Model {}
Orden.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tracking: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true
  },
  tiendaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tienda_id'
  },
  tarjetaId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'tarjeta_id'
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pending'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  direccionEntrega: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'direccion_entrega'
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Orden',
  tableName: 'ordenes'
});

class OrdenProducto extends Model {
  subtotal() {
    return Number(this.cantidad) * Number(this.precioUnitario);
  }
}
OrdenProducto.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ordenId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'orden_id'
  },
  productoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'producto_id'
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'precio_unitario'
  }
}, {
  sequelize,
  modelName: 'OrdenProducto',
  tableName: 'ordenes_productos'
});

class OrdenUsuario extends Model {}
OrdenUsuario.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ordenId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'orden_id'
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'usuario_id'
  },
  esPropietario: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'es_propietario'
  },
  esRepartidor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'es_repartidor'
  }
}, {
  sequelize,
  modelName: 'OrdenUsuario',
  tableName: 'ordenes_usuarios'
});

class HistorialEstado extends Model {}
HistorialEstado.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ordenId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'orden_id'
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'HistorialEstado',
  tableName: 'historial_estados'
});

Usuario.hasMany(Tarjeta, { foreignKey: 'usuario_id', as: 'tarjetas' });
Tarjeta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Tienda.hasMany(Producto, { foreignKey: 'tienda_id', as: 'productos' });
Producto.belongsTo(Tienda, { foreignKey: 'tienda_id', as: 'tienda' });

Orden.belongsTo(Tienda, { foreignKey: 'tienda_id', as: 'tienda' });
Orden.belongsTo(Tarjeta, { foreignKey: 'tarjeta_id', as: 'tarjeta' });
Orden.hasMany(OrdenProducto, { foreignKey: 'orden_id', as: 'items' });
OrdenProducto.belongsTo(Orden, { foreignKey: 'orden_id', as: 'orden' });
OrdenProducto.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Orden.hasMany(HistorialEstado, { foreignKey: 'orden_id', as: 'historial' });
HistorialEstado.belongsTo(Orden, { foreignKey: 'orden_id', as: 'orden' });

Usuario.belongsToMany(Orden, { through: OrdenUsuario, foreignKey: 'usuario_id', otherKey: 'orden_id', as: 'ordenes' });
Orden.belongsToMany(Usuario, { through: OrdenUsuario, foreignKey: 'orden_id', otherKey: 'usuario_id', as: 'usuarios' });
Orden.hasMany(OrdenUsuario, { foreignKey: 'orden_id', as: 'ordenUsuarios' });
OrdenUsuario.belongsTo(Orden, { foreignKey: 'orden_id', as: 'orden' });
OrdenUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
  sequelize,
  Usuario,
  Tarjeta,
  Tienda,
  Producto,
  Orden,
  OrdenUsuario,
  OrdenProducto,
  HistorialEstado
};
