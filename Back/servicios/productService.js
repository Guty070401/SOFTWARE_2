// src/services/productService.js
const { Producto, Tienda } = require('../models');

async function createProduct(data) {
  const { nombre, precio, tiendaId } = data;
  // Validar existencia de la tienda
  const tienda = await Tienda.findByPk(tiendaId);
  if (!tienda) {
    throw new Error('Tienda no encontrada');
  }
  // Crear producto asociado a la tienda
  const nuevoProd = await Producto.create({ 
    nombre, 
    precio, 
    tiendaId 
  });
  return nuevoProd;
}

async function listProducts() {
  // Obtener todos los productos con información de la tienda asociada
  return await Producto.findAll({ include: Tienda });
}

// ... editar, eliminar producto, etc.

module.exports = { createProduct, listProducts };
