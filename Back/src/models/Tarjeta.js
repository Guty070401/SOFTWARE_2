const { generateId } = require('../utils/id');

class Tarjeta {
  constructor({
    id = generateId('card_'),
    numeroTarjeta,
    vencimiento,
    csv,
    titulo = '',
    foto = null
  }) {
    this.id = id;
    this.numeroTarjeta = String(numeroTarjeta);
    this.vencimiento = vencimiento instanceof Date ? vencimiento : new Date(vencimiento);
    this.csv = String(csv);
    this.titulo = titulo;
    this.foto = foto;
    this.invalidada = false;
  }

  invalidateCard() {
    this.invalidada = true;
  }

  isExpired(referenceDate = new Date()) {
    if (Number.isNaN(this.vencimiento.getTime())) {
      return false;
    }
    return this.vencimiento < referenceDate;
  }

  getMaskedNumber() {
    const digits = this.numeroTarjeta.replace(/\D/g, '');
    if (digits.length <= 4) {
      return digits;
    }
    const visible = digits.slice(-4);
    return visible.padStart(digits.length, '•');
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      numero: this.getMaskedNumber(),
      vencimiento: this.vencimiento.toISOString(),
      foto: this.foto,
      invalidada: this.invalidada
    };
  }
}

module.exports = Tarjeta;
