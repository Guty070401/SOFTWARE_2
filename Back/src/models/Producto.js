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
      nombre: this.nombre,
      descripcion: this.descripcion,
      foto: this.foto,
      tiendaId: this.tiendaId,
      precio: this.precio
    };
  }
}

module.exports = Producto;
