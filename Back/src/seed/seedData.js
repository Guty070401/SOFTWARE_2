const {
  Usuario,
  Tienda,
  Producto
} = require('../models');
const { PASSWORD_REGEX } = require('../constants/user');

const stores = [
  {
    nombreOrigen: 'Café Andino',
    descripcion: 'Café de especialidad con granos peruanos',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
    productos: [
      { nombre: 'Café latte', descripcion: 'Shot de espresso con leche vaporizada', precio: 12.5, foto: null },
      { nombre: 'Capuccino', descripcion: 'Espresso con leche y espuma suave', precio: 11.5, foto: null },
      { nombre: 'Cold brew', descripcion: 'Café filtrado en frío por 14 horas', precio: 10, foto: null }
    ]
  },
  {
    nombreOrigen: 'Burger House',
    descripcion: 'Hamburguesas artesanales y papas fritas',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
    productos: [
      { nombre: 'Cheeseburger', descripcion: 'Carne angus, queso cheddar y pepinillos', precio: 24.9, foto: null },
      { nombre: 'Papas fritas', descripcion: 'Corte delgado con sal de la casa', precio: 8.9, foto: null },
      { nombre: 'Limonada', descripcion: 'Refrescante limonada con hierbabuena', precio: 6.5, foto: null }
    ]
  },
  {
    nombreOrigen: 'Sushi Market',
    descripcion: 'Makis y sashimis hechos al momento',
    logo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
    productos: [
      { nombre: 'Maki acevichado', descripcion: 'Crocante con salsa acevichada', precio: 28.5, foto: null },
      { nombre: 'Sashimi salmón', descripcion: 'Láminas de salmón fresco', precio: 32, foto: null },
      { nombre: 'Gyozas', descripcion: 'Empanaditas de cerdo al vapor', precio: 18.5, foto: null }
    ]
  }
];

async function seedUsers() {
  const count = await Usuario.count();
  if (count > 0) {
    return;
  }

  const basePassword = 'Ulima@2024';
  if (!PASSWORD_REGEX.test(basePassword)) {
    throw new Error('La contraseña base no cumple con la política de seguridad');
  }

  await Usuario.createWithPassword({
    nombreUsuario: 'Administrador',
    correo: '00000000@aloe.ulima.edu.pe',
    password: basePassword,
    rol: 'admin'
  });

  await Usuario.createWithPassword({
    nombreUsuario: 'Repartidor',
    correo: '11111111@aloe.ulima.edu.pe',
    password: basePassword,
    rol: 'courier'
  });

  await Usuario.createWithPassword({
    nombreUsuario: 'Cliente',
    correo: '22222222@aloe.ulima.edu.pe',
    password: basePassword,
    rol: 'customer'
  });
}

async function seedStores() {
  const count = await Tienda.count();
  if (count > 0) {
    return;
  }

  for (const store of stores) {
    const createdStore = await Tienda.create({
      nombreOrigen: store.nombreOrigen,
      descripcion: store.descripcion,
      logo: store.logo
    });

    for (const product of store.productos) {
      await Producto.create({
        tiendaId: createdStore.id,
        nombre: product.nombre,
        descripcion: product.descripcion,
        foto: product.foto,
        precio: product.precio
      });
    }
  }
}

async function seedData() {
  await seedUsers();
  await seedStores();
}

module.exports = seedData;
