const { Tienda, Producto } = require('../models');

function mapProduct(product) {
  if (!product) {
    return null;
  }
  return {
    id: product.id,
    name: product.nombre,
    desc: product.descripcion,
    image: product.foto,
    price: Number(product.precio)
  };
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
      .map(mapProduct)
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

async function getStore(storeId) {
  return Tienda.findByPk(storeId, { include: [{ model: Producto, as: 'productos' }] });
}

async function getProduct(productId) {
  return Producto.findByPk(productId);
}

module.exports = {
  listStores,
  getStore,
  getProduct,
  mapStore,
  mapProduct
};
