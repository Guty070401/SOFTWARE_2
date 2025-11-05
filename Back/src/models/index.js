const sequelize = require('../database/connection');
const Usuario = require('./Usuario');
const Tarjeta = require('./Tarjeta');
const Tienda = require('./Tienda');
const Producto = require('./Producto');
const Orden = require('./Orden');
const OrdenProducto = require('./OrdenProducto');
const OrdenUsuario = require('./OrdenUsuario');
const HistorialEstado = require('./HistorialEstado');

Usuario.hasMany(Tarjeta, { as: 'tarjetas', foreignKey: 'usuarioId' });
Tarjeta.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });

Tienda.hasMany(Producto, { as: 'productos', foreignKey: 'tiendaId' });
Producto.belongsTo(Tienda, { as: 'tienda', foreignKey: 'tiendaId' });

Orden.belongsTo(Tienda, { as: 'tienda', foreignKey: 'tiendaId' });
Orden.belongsTo(Tarjeta, { as: 'tarjeta', foreignKey: 'tarjetaId' });
Tarjeta.hasMany(Orden, { as: 'ordenes', foreignKey: 'tarjetaId' });

Orden.hasMany(OrdenProducto, { as: 'items', foreignKey: 'ordenId' });
OrdenProducto.belongsTo(Orden, { as: 'orden', foreignKey: 'ordenId' });
OrdenProducto.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });
Producto.hasMany(OrdenProducto, { as: 'ordenes', foreignKey: 'productoId' });

Orden.belongsToMany(Usuario, { through: OrdenUsuario, as: 'usuarios', foreignKey: 'ordenId', otherKey: 'usuarioId' });
Usuario.belongsToMany(Orden, { through: OrdenUsuario, as: 'ordenes', foreignKey: 'usuarioId', otherKey: 'ordenId' });
OrdenUsuario.belongsTo(Orden, { as: 'orden', foreignKey: 'ordenId' });
OrdenUsuario.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });

Orden.hasMany(HistorialEstado, { as: 'historial', foreignKey: 'ordenId' });
HistorialEstado.belongsTo(Orden, { as: 'orden', foreignKey: 'ordenId' });

module.exports = {
  sequelize,
  Usuario,
  Tarjeta,
  Tienda,
  Producto,
  Orden,
  OrdenProducto,
  OrdenUsuario,
  HistorialEstado
};
