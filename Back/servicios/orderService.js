// src/services/orderService.js
const { Orden, Producto, Usuario, OrdenProducto, HistorialEstado } = require('../models');

async function createOrder(userId, productos) {
  // Crear la orden
  const nuevaOrden = await Orden.create({ /* podemos pasar campos como total, etc. */ });
  
  // Asociar la orden con el usuario (tabla intermedia Orden_Usuario)
  // Asumiendo que la relación Usuario-Orden está establecida, podemos hacer:
  const usuario = await Usuario.findByPk(userId);
  if (!usuario) throw new Error('Usuario no encontrado');
  await usuario.addOrden(nuevaOrden);
  
  // Agregar productos a la orden con sus cantidades
  for (const item of productos) {
    const prod = await Producto.findByPk(item.productoId);
    if (!prod) throw new Error('Producto no existe: ' + item.productoId);
    // usamos la asociación muchos a muchos:
    await nuevaOrden.addProducto(prod, { through: { cantidad: item.cantidad || 1 } });
  }

  // Registrar el estado inicial en Historial_Estados
  await HistorialEstado.create({ 
    ordenId: nuevaOrden.id, 
    estado: 'CREADA', 
    fecha_cambio: new Date()
  });

  return nuevaOrden;
}

// ...otros métodos como getOrderById, updateOrderStatus, etc.

module.exports = { createOrder };
