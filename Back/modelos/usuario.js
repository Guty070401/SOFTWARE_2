// src/models/usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');  // nuestra instancia de Sequelize

const Usuario = sequelize.define('Usuario', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true  // no se permiten correos duplicados
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('ADMIN', 'USER'),
    allowNull: false,
    defaultValue: 'USER'
  }
}, {
  tableName: 'Usuario'
});

module.exports = Usuario;
