// src/models/orden.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Orden = sequelize.define('Orden', {
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW   // por defecto, fecha actual
  },
  estado_actual: {
    type: DataTypes.STRING,       // podría ser un ENUM de estados válidos
    allowNull: false,
    defaultValue: 'CREADA'
  },
  // total, u otros campos
}, {
  tableName: 'Orden'
});

module.exports = Orden;
