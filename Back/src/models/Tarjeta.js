const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/connection');

function maskCardNumber(numero) {
  const digits = (numero || '').replace(/\D/g, '');
  if (digits.length <= 4) {
    return digits;
  }
  const visible = digits.slice(-4);
  return visible.padStart(digits.length, '•');
}

class Tarjeta extends Model {
  invalidateCard() {
    this.invalidada = true;
    return this.save();
  }

  isExpired(referenceDate = new Date()) {
    if (!this.vencimiento) {
      return false;
    }
    return this.vencimiento < referenceDate;
  }

  getMaskedNumber() {
    return maskCardNumber(this.numeroTarjeta);
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      numero: this.getMaskedNumber(),
      vencimiento: this.vencimiento ? this.vencimiento.toISOString() : null,
      foto: this.foto,
      invalidada: this.invalidada
    };
  }
}

Tarjeta.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'usuario_id'
  },
  numeroTarjeta: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'numero_tarjeta'
  },
  vencimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  csv: {
    type: DataTypes.STRING,
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  invalidada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Tarjeta',
  tableName: 'tarjetas'
});

module.exports = Tarjeta;
