// src/models/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Inicializar Sequelize con datos de conexión de PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
  }
);



// Exportamos la instancia para usarla en los modelos
module.exports = sequelize;

// src/models/index.js (continuación después de definir sequelize y importar modelos)
const Usuario = require('./usuario');
const Tarjeta = require('./tarjeta');
const Tienda = require('./tienda');
const Producto = require('./producto');
const Orden = require('./orden');
const OrdenUsuario = require('./ordenUsuario');
const OrdenProducto = require('./ordenProducto');
const HistorialEstado = require('./historialEstado');
const Tarjeta = require('./tarjeta');

Usuario.hasMany(Tarjeta, { foreignKey: 'usuario_id' });
Tarjeta.belongsTo(Usuario, { foreignKey: 'usuario_id' });


// Relaciones Uno a Muchos: Usuario -> Tarjeta
Usuario.hasMany(Tarjeta, { foreignKey: 'usuarioId' });
Tarjeta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Uno a Muchos: Usuario -> Tienda (Usuario dueño de Tienda, opcional según modelo)
Usuario.hasMany(Tienda, { foreignKey: 'usuarioId' });
Tienda.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Uno a Muchos: Tienda -> Producto
Tienda.hasMany(Producto, { foreignKey: 'tiendaId' });
Producto.belongsTo(Tienda, { foreignKey: 'tiendaId' });

// Muchos a Muchos: Usuario <-> Orden (vía Orden_Usuario)
Usuario.belongsToMany(Orden, { through: OrdenUsuario, foreignKey: 'usuarioId', otherKey: 'ordenId' });
Orden.belongsToMany(Usuario, { through: OrdenUsuario, foreignKey: 'ordenId', otherKey: 'usuarioId' });

// Muchos a Muchos: Orden <-> Producto (vía Orden_Producto)
Orden.belongsToMany(Producto, { through: OrdenProducto, foreignKey: 'ordenId', otherKey: 'productoId' });
Producto.belongsToMany(Orden, { through: OrdenProducto, foreignKey: 'productoId', otherKey: 'ordenId' });

// Uno a Muchos: Orden -> Historial_Estados
Orden.hasMany(HistorialEstado, { foreignKey: 'ordenId' });
HistorialEstado.belongsTo(Orden, { foreignKey: 'ordenId' });

// [Podríamos también vincular HistorialEstado con Usuario si quisiéramos registrar qué usuario cambió el estado, 
//  pero el diagrama dado no lo indica, así que lo omitimos]

// Exportar todos los modelos para poder usarlos en los servicios
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
