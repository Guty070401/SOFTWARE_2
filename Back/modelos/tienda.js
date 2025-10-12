// src/models/tienda.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Tienda = sequelize.define('Tienda', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // ... otros campos de Tienda, p.ej. direccion, descripcion
}, {
  tableName: 'Tienda'
});

module.exports = Tienda;
