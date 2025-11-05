const {
  sequelize,
  Usuario,
  Tienda,
  Producto,
  Tarjeta,
  Orden,
  OrdenProducto,
  OrdenUsuario,
  HistorialEstado
} = require('../models');
const { ORDER_STATUS } = require('../constants/orderStatus');
const { generateId } = require('../utils/id');

let seeded = false;

async function seedData() {
  if (seeded) {
    return;
  }

  const storeCount = await Tienda.count();
  if (storeCount > 0) {
    seeded = true;
    return;
  }

  const transaction = await sequelize.transaction();
  try {
    const storesPayload = [
      {
        nombreOrigen: 'Bembos',
        descripcion: 'Las hamburguesas más bravas',
        logo: 'https://images.ufood.app/bembos-logo.png',
        productos: [
          {
            nombre: 'Nuggets',
            descripcion: 'Nuggets de pollo crujientes.',
            foto: 'https://images.ufood.app/nuggets.jpg',
            precio: 18
          },
          {
            nombre: 'Hamburguesa Extrema',
            descripcion: 'Doble carne y queso Edam.',
            foto: 'https://images.ufood.app/hamburguesa-extrema.jpg',
            precio: 20.9
          }
        ]
      },
      {
        nombreOrigen: 'La Nevera Fit',
        descripcion: 'Tus desayunos siempre ganan',
        logo: 'https://images.ufood.app/neverafit-logo.png',
        productos: [
          {
            nombre: 'Açai Bowl',
            descripcion: 'Con granola, plátano, fresas y arándanos.',
            foto: 'https://images.ufood.app/acai.jpg',
            precio: 25
          },
          {
            nombre: 'Tostadas con Palta',
            descripcion: 'Pan integral con palta y semillas.',
            foto: 'https://images.ufood.app/tostadas.jpg',
            precio: 15
          }
        ]
      },
      {
        nombreOrigen: 'Mr. Sushi',
        descripcion: 'Cada maki es un bocado de pura felicidad',
        logo: 'https://images.ufood.app/mr-sushi-logo.png',
        productos: [
          {
            nombre: 'Acevichado Maki',
            descripcion: 'Roll de langostino y pesca del día.',
            foto: 'https://images.ufood.app/acevichado.jpg',
            precio: 28
          },
          {
            nombre: 'Poke Atún Fresco',
            descripcion: 'Base de arroz sushi y cubos de atún.',
            foto: 'https://images.ufood.app/poke.jpg',
            precio: 29.9
          }
        ]
      }
    ];

    const stores = [];
    for (const payload of storesPayload) {
      const store = await Tienda.create({
        nombreOrigen: payload.nombreOrigen,
        descripcion: payload.descripcion,
        logo: payload.logo,
        cantidad: payload.productos.length
      }, { transaction });
      for (const productPayload of payload.productos) {
        await Producto.create({
          tiendaId: store.id,
          nombre: productPayload.nombre,
          descripcion: productPayload.descripcion,
          foto: productPayload.foto,
          precio: productPayload.precio
        }, { transaction });
      }
      stores.push(store);
    }

    const courier = await Usuario.createWithPassword({
      nombreUsuario: 'Courier UFOOD',
      correo: '20023456@aloe.ulima.edu.pe',
      password: '123456',
      rol: 'courier',
      celular: '999999999'
    }, { transaction });

    const customer = await Usuario.createWithPassword({
      nombreUsuario: 'Cliente Demo',
      correo: '20123456@aloe.ulima.edu.pe',
      password: '123456',
      rol: 'customer',
      celular: '988888888'
    }, { transaction });

    const card = await Tarjeta.create({
      usuarioId: customer.id,
      numeroTarjeta: '4111111111111111',
      vencimiento: new Date(new Date().getFullYear() + 2, 0, 1),
      csv: '123',
      titulo: 'Visa personal'
    }, { transaction });

    const storeBembos = stores[0];
    const products = await Producto.findAll({ where: { tiendaId: storeBembos.id }, transaction });

    const order = await Orden.create({
      tracking: generateId('trk_'),
      tiendaId: storeBembos.id,
      tarjetaId: card.id,
      direccionEntrega: 'Av. Demo 123, Lima',
      comentarios: 'Sin cebolla, por favor',
      total: 0
    }, { transaction });

    let total = 0;
    for (const product of products.slice(0, 2)) {
      const cantidad = product.nombre === 'Nuggets' ? 2 : 1;
      const precio = Number(product.precio);
      await OrdenProducto.create({
        ordenId: order.id,
        productoId: product.id,
        cantidad,
        precioUnitario: precio
      }, { transaction });
      total += cantidad * precio;
    }

    order.total = Number(total.toFixed(2));
    await order.save({ transaction });

    await HistorialEstado.bulkCreate([
      { ordenId: order.id, estado: ORDER_STATUS.PENDING, comentarios: 'Pedido registrado' },
      { ordenId: order.id, estado: ORDER_STATUS.ACCEPTED, comentarios: 'Tienda aceptó el pedido' },
      { ordenId: order.id, estado: ORDER_STATUS.ON_ROUTE, comentarios: 'Repartidor en camino' }
    ], { transaction });

    await OrdenUsuario.bulkCreate([
      { ordenId: order.id, usuarioId: customer.id, esPropietario: true },
      { ordenId: order.id, usuarioId: courier.id, esRepartidor: true }
    ], { transaction });

    await transaction.commit();
    seeded = true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = seedData;
