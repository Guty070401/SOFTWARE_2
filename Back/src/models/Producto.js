const { generateId } = require('../utils/id');

class Producto {
  constructor({
    id = generateId('prd_'),
    nombre,
    descripcion = '',
    foto = null,
    tiendaId,
    precio
  }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.foto = foto;
    this.tiendaId = tiendaId;
    this.precio = Number(precio);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.nombre,
      desc: this.descripcion,
      image: this.foto,
      storeId: this.tiendaId,
      price: this.precio
    };
  }
}

module.exports = Producto;
