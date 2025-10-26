const { tiendas, productos } = require('../data/database');

function mapProduct(product) {
  if (!product) {
    return null;
  }
  const { storeId, ...rest } = product.toJSON();
  return rest;
}

function mapStore(store, { includeItems = true } = {}) {
  if (!store) {
    return null;
  }

  const storeData = store.toJSON();
  const items = includeItems
    ? Array.from(store.productos)
      .map((productId) => mapProduct(productos.get(productId)))
      .filter(Boolean)
    : null;

  const dto = {
    id: storeData.id,
    name: storeData.name,
    desc: storeData.desc,
    image: storeData.logo,
    logo: storeData.logo,
    cantidad: storeData.cantidad
  };

  if (includeItems) {
    dto.items = items;
  }

  return dto;
}

function listStores() {
  return Array.from(tiendas.values()).map((store) => mapStore(store, { includeItems: true }));
}

function getStore(storeId) {
  return tiendas.get(storeId) || null;
}

function getProduct(productId) {
  return productos.get(productId) || null;
}

module.exports = {
  listStores,
  getStore,
  getProduct,
  mapStore,
  mapProduct
};
