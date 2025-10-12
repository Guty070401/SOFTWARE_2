// src/models/historialEstado.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const HistorialEstado = sequelize.define('Historial_Estado', {
  estado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_cambio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Historial_Estados',
  updatedAt: false,    // usamos fecha_cambio en lugar de updatedAt
  createdAt: false     // evitamos timestamps automáticos
});

module.exports = HistorialEstado;
