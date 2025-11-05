const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../database/connection');

class Producto extends Model {
  toJSON() {
    return {
      id: this.id,
      name: this.nombre,
      desc: this.descripcion,
      image: this.foto,
      storeId: this.tiendaId,
      price: Number(this.precio)
    };
  }
}

Producto.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tiendaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tienda_id'
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Producto',
  tableName: 'productos'
});

module.exports = Producto;
