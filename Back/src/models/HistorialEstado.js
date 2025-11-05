const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/connection');

class HistorialEstado extends Model {
  toJSON() {
    return {
      id: this.id,
      ordenId: this.ordenId,
      estado: this.estado,
      comentarios: this.comentarios,
      hora: this.hora ? this.hora.toISOString() : null
    };
  }
}

HistorialEstado.init({
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
  estado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'HistorialEstado',
  tableName: 'historial_estados'
});

module.exports = HistorialEstado;
