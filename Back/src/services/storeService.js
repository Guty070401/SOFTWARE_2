const { tiendas, productos } = require('../data/database');

function listStores() {
  return Array.from(tiendas.values()).map((store) => {
    const storeProducts = Array.from(store.productos).map((productId) => {
      const product = productos.get(productId);
      return product ? product.toJSON() : null;
    }).filter(Boolean);

    return {
      id: store.id,
      nombre: store.nombreOrigen,
      logo: store.logo,
      productos: storeProducts
    };
  });
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
  getProduct
};
