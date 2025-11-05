const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../database/connection');

class OrdenProducto extends Model {
  subtotal() {
    return Number(this.cantidad) * Number(this.precioUnitario);
  }

  toJSON() {
    return {
      productoId: this.productoId,
      cantidad: this.cantidad,
      precioUnitario: Number(this.precioUnitario),
      subtotal: Number(this.subtotal().toFixed(2))
    };
  }
}

OrdenProducto.init({
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
  productoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'producto_id'
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'precio_unitario'
  }
}, {
  sequelize,
  modelName: 'OrdenProducto',
  tableName: 'orden_productos'
});

module.exports = OrdenProducto;
