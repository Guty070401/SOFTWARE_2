// src/models/ordenProducto.js (tabla intermedia Orden-Producto)
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const OrdenProducto = sequelize.define('Orden_Producto', {
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'Orden_Producto',
  timestamps: false  // esta tabla solo vincula, por simplicidad sin createdAt/updatedAt
});

module.exports = OrdenProducto;
