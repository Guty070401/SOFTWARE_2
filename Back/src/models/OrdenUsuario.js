const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../database/connection');

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
  tableName: 'orden_usuarios'
});

module.exports = OrdenUsuario;
