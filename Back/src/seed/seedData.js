const Usuario = require('../models/Usuario');
const Tienda = require('../models/Tienda');
const Producto = require('../models/Producto');
const Tarjeta = require('../models/Tarjeta');
const {
  usuarios,
  tiendas,
  productos,
  tarjetas
} = require('../data/database');

let seeded = false;

async function seedData() {
  if (seeded) {
    return;
  }

  const storeBembos = new Tienda({
    nombreOrigen: 'Bembos',
    logo: 'https://images.ufood.app/bembos-logo.png'
  });
  const storeNevera = new Tienda({
    nombreOrigen: 'La Nevera Fit',
    logo: 'https://images.ufood.app/neverafit-logo.png'
  });
  const storeSushi = new Tienda({
    nombreOrigen: 'Mr. Sushi',
    logo: 'https://images.ufood.app/mr-sushi-logo.png'
  });

  [storeBembos, storeNevera, storeSushi].forEach((store) => {
    tiendas.set(store.id, store);
  });

  const productsPayload = [
    {
      store: storeBembos,
      data: [
        { nombre: 'Nuggets', descripcion: 'Nuggets de pollo crujientes.', foto: 'https://images.ufood.app/nuggets.jpg', precio: 18 },
        { nombre: 'Hamburguesa Extrema', descripcion: 'Doble carne y queso Edam.', foto: 'https://images.ufood.app/hamburguesa-extrema.jpg', precio: 20.9 }
      ]
    },
    {
      store: storeNevera,
      data: [
        { nombre: 'Açai Bowl', descripcion: 'Con granola, plátano, fresas y arándanos.', foto: 'https://images.ufood.app/acai.jpg', precio: 25 },
        { nombre: 'Tostadas con Palta', descripcion: 'Pan integral con palta y semillas.', foto: 'https://images.ufood.app/tostadas.jpg', precio: 15 }
      ]
    },
    {
      store: storeSushi,
      data: [
        { nombre: 'Acevichado Maki', descripcion: 'Roll de langostino y pesca del día.', foto: 'https://images.ufood.app/acevichado.jpg', precio: 28 },
        { nombre: 'Poke Atún Fresco', descripcion: 'Base de arroz sushi y cubos de atún.', foto: 'https://images.ufood.app/poke.jpg', precio: 29.9 }
      ]
    }
  ];

  productsPayload.forEach(({ store, data }) => {
    data.forEach((payload) => {
      const product = new Producto({ ...payload, tiendaId: store.id });
      productos.set(product.id, product);
      store.agregarProducto(product.id);
    });
  });

  const courier = await Usuario.createWithPassword({
    nombreUsuario: 'Courier UFOOD',
    correo: 'courier@ufood.com',
    password: '123456',
    rol: 'courier',
    celular: '999999999'
  });
  usuarios.set(courier.id, courier);

  const customer = await Usuario.createWithPassword({
    nombreUsuario: 'Cliente Demo',
    correo: 'cliente@ufood.com',
    password: '123456',
    rol: 'customer',
    celular: '988888888'
  });
  usuarios.set(customer.id, customer);

  const card = new Tarjeta({
    numeroTarjeta: '4111111111111111',
    vencimiento: new Date(new Date().getFullYear() + 2, 0, 1),
    csv: '123',
    titulo: 'Visa personal'
  });
  tarjetas.set(card.id, card);
  customer.agregarTarjeta(card.id);

  seeded = true;
}

module.exports = seedData;
