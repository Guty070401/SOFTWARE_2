const { generateId } = require('../utils/id');

class Tienda {
  constructor({
    id = generateId('store_'),
    nombreOrigen,
    logo = null
  }) {
    this.id = id;
    this.nombreOrigen = nombreOrigen;
    this.logo = logo;
    this.productos = new Set();
  }

  agregarProducto(productoId) {
    this.productos.add(productoId);
  }

  eliminarProducto(productoId) {
    this.productos.delete(productoId);
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombreOrigen,
      logo: this.logo
    };
  }
}

module.exports = Tienda;
