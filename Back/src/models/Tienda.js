const { generateId } = require('../utils/id');

class Tienda {
  constructor({
    id = generateId('store_'),
    nombreOrigen,
    descripcion = '',
    logo = null,
    cantidad = 0
  }) {
    this.id = id;
    this.nombreOrigen = nombreOrigen;
    this.descripcion = descripcion;
    this.logo = logo;
    this.productos = new Set();
    this.cantidad = Number.isFinite(cantidad) ? cantidad : 0;
  }

  agregarProducto(productoId) {
    this.productos.add(productoId);
    this.cantidad = this.productos.size;
  }

  eliminarProducto(productoId) {
    this.productos.delete(productoId);
    this.cantidad = this.productos.size;
  }

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

module.exports = Tienda;
