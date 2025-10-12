// src/models/tarjeta.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const BRANDS = ['VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'DISCOVER'];

const Tarjeta = sequelize.define(
  'Tarjeta',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    // Marca de la tarjeta (no derivamos, la entrega el PSP)
    brand: {
      type: DataTypes.ENUM(...BRANDS),
      allowNull: false,
      validate: { isIn: [BRANDS] },
    },

    // Últimos 4 dígitos — solo display, nunca PAN completo
    last4: {
      type: DataTypes.CHAR(4),
      allowNull: false,
      validate: { is: /^[0-9]{4}$/ },
    },

    holderName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      set(v) {
        this.setDataValue('holderName', v?.trim());
      },
    },

    // Token seguro entregado por el PSP (único)
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    expMonth: {
      type: DataTypes.TINYINT, // 1..12
      allowNull: false,
      validate: { min: 1, max: 12 },
    },

    expYear: {
      type: DataTypes.SMALLINT, // ej. 2026
      allowNull: false,
      validate: { min: 2020, max: 2100 },
    },

    // Estado lógico de la tarjeta en la wallet
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },

    // FK → Usuario
    usuarioId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Usuario', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      field: 'usuario_id',
    },
  },
  {
    tableName: 'Tarjeta',
    underscored: true,
    timestamps: true,

    // No exponemos el token por defecto
    defaultScope: {
      attributes: { exclude: ['token'] },
    },
    scopes: {
      withToken: {}, // usar Tarjeta.scope('withToken') si necesitas el token
      safe: { attributes: ['id', 'brand', 'last4', 'holderName', 'expMonth', 'expYear', 'status'] },
    },

    indexes: [
      { fields: ['usuario_id'] },
      { unique: true, fields: ['token'] },
    ],
  }
);

// Asociaciones: se definen en models/index.js
//   Usuario.hasMany(Tarjeta, { foreignKey: 'usuario_id' })
//   Tarjeta.belongsTo(Usuario, { foreignKey: 'usuario_id' })

// Hooks opcionales de sanidad
Tarjeta.addHook('beforeValidate', (t) => {
  if (typeof t.holderName === 'string') t.holderName = t.holderName.trim();
});

module.exports = Tarjeta;
