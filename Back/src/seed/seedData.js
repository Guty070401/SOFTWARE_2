const Usuario = require('../models/Usuario');
const Tarjeta = require('../models/Tarjeta');
const { supabase } = require('../data/database');

let seeded = false;

const STORE_SEEDS = [
  { id: 'store_bembos', nombre: 'Bembos', logo: 'https://images.ufood.app/bembos-logo.png' },
  { id: 'store_nevera', nombre: 'La Nevera Fit', logo: 'https://images.ufood.app/neverafit-logo.png' },
  { id: 'store_sushi', nombre: 'Mr. Sushi', logo: 'https://images.ufood.app/mr-sushi-logo.png' }
];

const PRODUCT_SEEDS = [
  { id: 'prod_nuggets', tiendaId: 'store_bembos', nombre: 'Nuggets', descripcion: 'Nuggets de pollo crujientes.', foto: 'https://images.ufood.app/nuggets.jpg', precio: 18 },
  { id: 'prod_extrema', tiendaId: 'store_bembos', nombre: 'Hamburguesa Extrema', descripcion: 'Doble carne y queso Edam.', foto: 'https://images.ufood.app/hamburguesa-extrema.jpg', precio: 20.9 },
  { id: 'prod_acai', tiendaId: 'store_nevera', nombre: 'Açai Bowl', descripcion: 'Con granola, plátano, fresas y arándanos.', foto: 'https://images.ufood.app/acai.jpg', precio: 25 },
  { id: 'prod_tostadas', tiendaId: 'store_nevera', nombre: 'Tostadas con Palta', descripcion: 'Pan integral con palta y semillas.', foto: 'https://images.ufood.app/tostadas.jpg', precio: 15 },
  { id: 'prod_acevichado', tiendaId: 'store_sushi', nombre: 'Acevichado Maki', descripcion: 'Roll de langostino y pesca del día.', foto: 'https://images.ufood.app/acevichado.jpg', precio: 28 },
  { id: 'prod_poke', tiendaId: 'store_sushi', nombre: 'Poke Atún Fresco', descripcion: 'Base de arroz sushi y cubos de atún.', foto: 'https://images.ufood.app/poke.jpg', precio: 29.9 }
];

const USER_SEEDS = [
  {
    id: 'usr_courier',
    nombre: 'Courier UFOOD',
    correo: 'courier@ufood.com',
    password: '123456',
    rol: 'courier',
    celular: '999999999'
  },
  {
    id: 'usr_customer',
    nombre: 'Cliente Demo',
    correo: 'cliente@ufood.com',
    password: '123456',
    rol: 'customer',
    celular: '988888888'
  }
];

const CARD_SEEDS = [
  {
    id: 'card_demo',
    usuarioId: 'usr_customer',
    numeroTarjeta: '4111111111111111',
    vencimiento: new Date(new Date().getFullYear() + 2, 0, 1),
    csv: '123',
    titulo: 'Visa personal',
    foto: null
  }
];

async function seedData() {
  if (seeded) return;

  const storeRows = STORE_SEEDS.map((s) => ({
    id: s.id,
    nombre_origen: s.nombre,
    logo: s.logo || null
  }));
  const { error: storeErr } = await supabase.from('tiendas').upsert(storeRows, { onConflict: 'id' });
  if (storeErr) throw storeErr;

  const productRows = PRODUCT_SEEDS.map((p) => ({
    id: p.id,
    tienda_id: p.tiendaId,
    nombre: p.nombre,
    descripcion: p.descripcion || null,
    precio: p.precio,
    foto: p.foto || null
  }));
  if (productRows.length) {
    const { error: prodErr } = await supabase.from('productos').upsert(productRows, { onConflict: 'id' });
    if (prodErr) throw prodErr;
  }

  const userModels = await Promise.all(USER_SEEDS.map((u) => Usuario.createWithPassword({
    id: u.id,
    nombreUsuario: u.nombre,
    correo: u.correo,
    password: u.password,
    celular: u.celular,
    rol: u.rol
  })));
  const userRows = userModels.map((u) => ({
    id: u.id,
    nombre_usuario: u.nombreUsuario,
    correo: u.correo,
    celular: u.celular,
    password_hash: u.passwordHash,
    foto: u.foto,
    rol: u.rol,
    solucion: u.solucion
  }));
  if (userRows.length) {
    const { error: userErr } = await supabase.from('usuarios').upsert(userRows, { onConflict: 'id' });
    if (userErr) throw userErr;
  }

  const cardRows = CARD_SEEDS.map((seed) => {
    const card = new Tarjeta(seed);
    return {
      id: card.id,
      usuario_id: seed.usuarioId,
      numero_tarjeta: card.numeroTarjeta,
      vencimiento: card.vencimiento.toISOString().slice(0, 10),
      csv: card.csv,
      titulo: card.titulo,
      foto: card.foto,
      invalidada: card.invalidada
    };
  });
  if (cardRows.length) {
    const { error: cardErr } = await supabase.from('tarjetas').upsert(cardRows, { onConflict: 'id' });
    if (cardErr) throw cardErr;
  }

  seeded = true;
}

module.exports = seedData;
