const { Tienda, Producto } = require('../models');

function mapProduct(product, store) {
  if (!product) {
    return null;
  }
  const dto = {
    id: product.id,
    name: product.nombre,
    desc: product.descripcion,
    image: product.foto,
    price: Number(product.precio)
  };
  if (store) {
    dto.storeId = store.id;
    dto.storeName = store.nombreOrigen || store.name || '';
  }
  return dto;
}

function mapStore(store, { includeItems = true } = {}) {
  if (!store) {
    return null;
  }

  const dto = {
    id: store.id,
    name: store.nombreOrigen,
    desc: store.descripcion,
    image: store.logo,
    logo: store.logo,
    cantidad: typeof store.cantidad === 'number' ? store.cantidad : (store.productos?.length || 0)
  };

  if (includeItems) {
    const items = (store.productos || store.Productos || [])
      .map((product) => mapProduct(product, store))
      .filter(Boolean);
    dto.items = items;
  }

  return dto;
}

async function listStores() {
  const stores = await Tienda.findAll({
    include: [{ model: Producto, as: 'productos' }],
    order: [['nombre_origen', 'ASC']]
  });
  return stores.map((store) => mapStore({ ...store.get(), productos: store.productos }, { includeItems: true }));
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

async function createStore(payload = {}) {
  const nombreOrigen = pickString(payload.name, payload.nombre, payload.nombreOrigen);
  if (!nombreOrigen) {
    const error = new Error('El nombre de la tienda es obligatorio.');
    error.status = 400;
    throw error;
  }

  const descripcion = pickString(payload.desc, payload.descripcion, payload.description) || null;
  const logo = pickString(payload.logo, payload.image, payload.imagen) || null;

  const store = await Tienda.create({
    nombreOrigen,
    descripcion,
    logo
  });

  return mapStore({ ...store.get({ plain: true }), productos: [] }, { includeItems: true });
}

async function getStore(storeId) {
  return Tienda.findByPk(storeId, { include: [{ model: Producto, as: 'productos' }] });
}

async function getProduct(productId) {
  return Producto.findByPk(productId);
}

module.exports = {
  listStores,
  createStore,
  getStore,
  getProduct,
  mapStore,
  mapProduct
};
