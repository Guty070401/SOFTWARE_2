const { generateId } = require('../utils/id');

class OrdenProducto {
  constructor({
    id = generateId('ord_prod_'),
    ordenId,
    productoId,
    cantidad,
    precioUnitario
  }) {
    this.id = id;
    this.ordenId = ordenId;
    this.productoId = productoId;
    this.cantidad = Number(cantidad) || 1;
    this.precioUnitario = Number(precioUnitario);
  }

  subtotal() {
    return this.cantidad * this.precioUnitario;
  }

  toJSON() {
    return {
      productoId: this.productoId,
      cantidad: this.cantidad,
      precioUnitario: this.precioUnitario,
      subtotal: this.subtotal()
    };
  }
}

module.exports = OrdenProducto;
