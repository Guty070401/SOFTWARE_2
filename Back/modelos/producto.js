// src/models/producto.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Producto = sequelize.define('Producto', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  // ... otros campos como descripcion, stock, etc.
}, {
  tableName: 'Producto'
});

module.exports = Producto;
