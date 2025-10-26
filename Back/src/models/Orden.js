const { generateId } = require('../utils/id');
const { ORDER_STATUS } = require('../constants/orderStatus');

class Orden {
  constructor({
    id = generateId('ord_'),
    tracking = generateId('trk_'),
    fecha = new Date(),
    hora = new Date(),
    estado = ORDER_STATUS.PENDING,
    solucion = false,
    tiempoEstimado = null,
    tiendaId,
    tarjetaId = null,
    direccionEntrega = '',
    comentarios = ''
  }) {
    this.id = id;
    this.tracking = tracking;
    this.fecha = fecha instanceof Date ? fecha : new Date(fecha);
    this.hora = hora instanceof Date ? hora : new Date(hora);
    this.estado = estado;
    this.solucion = solucion;
    this.tiempoEstimado = tiempoEstimado;
    this.tiendaId = tiendaId;
    this.tarjetaId = tarjetaId;
    this.direccionEntrega = direccionEntrega;
    this.comentarios = comentarios;
    this.items = [];
    this.total = 0;
    this.historial = [];
    this.createdAt = new Date();
  }

  addItem(orderProduct) {
    this.items.push(orderProduct);
    this.total = Number((this.total + orderProduct.subtotal()).toFixed(2));
  }

  addHistorial(historial) {
    this.historial.push(historial);
    this.estado = historial.estado;
  }

  toJSON() {
    return {
      id: this.id,
      tracking: this.tracking,
      fecha: this.fecha.toISOString(),
      hora: this.hora.toISOString(),
      estado: this.estado,
      solucion: this.solucion,
      tiempoEstimado: this.tiempoEstimado,
      tiendaId: this.tiendaId,
      total: this.total,
      direccionEntrega: this.direccionEntrega,
      comentarios: this.comentarios
    };
  }
}

module.exports = Orden;
