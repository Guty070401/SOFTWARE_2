const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/connection');

class Tienda extends Model {
  toJSON() {
    return {
      id: this.id,
      name: this.nombreOrigen,
      desc: this.descripcion,
      logo: this.logo,
      cantidad: this.cantidad
    };
  }
}

Tienda.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombreOrigen: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'nombre_origen'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Tienda',
  tableName: 'tiendas'
});

module.exports = Tienda;
