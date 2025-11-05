const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../database/connection');
const { ORDER_STATUS } = require('../constants/orderStatus');

class Orden extends Model {
  toJSON() {
    return {
      id: this.id,
      tracking: this.tracking,
      fecha: this.fecha ? this.fecha.toISOString() : null,
      hora: this.hora ? this.hora.toISOString() : null,
      estado: this.estado,
      solucion: this.solucion,
      tiempoEstimado: this.tiempoEstimado,
      tiendaId: this.tiendaId,
      total: Number(this.total || 0),
      direccionEntrega: this.direccionEntrega,
      comentarios: this.comentarios
    };
  }
}

Orden.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tracking: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
    allowNull: false,
    defaultValue: ORDER_STATUS.PENDING
  },
  solucion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tiempoEstimado: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tiempo_estimado'
  },
  direccionEntrega: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'direccion_entrega'
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tiendaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tienda_id'
  },
  tarjetaId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'tarjeta_id'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Orden',
  tableName: 'ordenes'
});

module.exports = Orden;
