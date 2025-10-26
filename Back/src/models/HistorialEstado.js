const { generateId } = require('../utils/id');

class HistorialEstado {
  constructor({
    id = generateId('ord_hist_'),
    ordenId,
    estado,
    comentarios = '',
    hora = new Date()
  }) {
    this.id = id;
    this.ordenId = ordenId;
    this.estado = estado;
    this.comentarios = comentarios;
    this.hora = hora instanceof Date ? hora : new Date(hora);
  }

  toJSON() {
    return {
      id: this.id,
      ordenId: this.ordenId,
      estado: this.estado,
      comentarios: this.comentarios,
      hora: this.hora.toISOString()
    };
  }
}

module.exports = HistorialEstado;
