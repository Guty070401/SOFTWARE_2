const {
  Tienda,
  Producto,
  Orden,
  OrdenProducto
} = require('../models');

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

async function createProduct(storeId, payload = {}) {
  const resolvedStoreId = String(storeId || '').trim();
  if (!resolvedStoreId) {
    const error = new Error('El identificador de la tienda es obligatorio.');
    error.status = 400;
    throw error;
  }

  const store = await getStore(resolvedStoreId);
  if (!store) {
    const error = new Error('Tienda no encontrada.');
    error.status = 404;
    throw error;
  }

  const nombre = pickString(payload.name, payload.nombre, payload.nombreOrigen, payload.title);
  if (!nombre) {
    const error = new Error('El nombre del producto es obligatorio.');
    error.status = 400;
    throw error;
  }

  const priceSource = payload.price ?? payload.precio ?? payload.unitPrice;
  const priceValue = Number(priceSource);
  if (!Number.isFinite(priceValue) || priceValue < 0) {
    const error = new Error('El precio del producto es inválido.');
    error.status = 400;
    throw error;
  }
  const precio = priceValue.toFixed(2);

  const descripcion = pickString(payload.desc, payload.descripcion, payload.description) || null;
  const foto = pickString(payload.image, payload.foto, payload.photo, payload.imagen) || null;

  const product = await Producto.create({
    tiendaId: store.id,
    nombre,
    descripcion,
    foto,
    precio
  });

  const storeData = store.get ? store.get({ plain: true }) : store;

  return mapProduct(product.get({ plain: true }), {
    ...storeData,
    id: store.id,
    nombreOrigen: storeData?.nombreOrigen ?? storeData?.name ?? ''
  });
}

async function deleteStore(storeId) {
  const resolvedStoreId = String(storeId || '').trim();
  if (!resolvedStoreId) {
    const error = new Error('El identificador de la tienda es obligatorio.');
    error.status = 400;
    throw error;
  }

  const store = await getStore(resolvedStoreId);
  if (!store) {
    const error = new Error('Tienda no encontrada.');
    error.status = 404;
    throw error;
  }

  const plainStore = store.get ? store.get({ plain: true }) : store;

  const relatedOrders = await Orden.count({ where: { tiendaId: store.id } });
  if (relatedOrders > 0) {
    const error = new Error('No se puede eliminar la tienda porque tiene pedidos asociados.');
    error.status = 409;
    throw error;
  }

  await store.destroy();

  return mapStore({ ...plainStore, productos: [] }, { includeItems: false });
}

async function deleteProduct(storeId, productId) {
  const resolvedStoreId = String(storeId || '').trim();
  if (!resolvedStoreId) {
    const error = new Error('El identificador de la tienda es obligatorio.');
    error.status = 400;
    throw error;
  }

  const resolvedProductId = String(productId || '').trim();
  if (!resolvedProductId) {
    const error = new Error('El identificador del producto es obligatorio.');
    error.status = 400;
    throw error;
  }

  const store = await getStore(resolvedStoreId);
  if (!store) {
    const error = new Error('Tienda no encontrada.');
    error.status = 404;
    throw error;
  }

  const product = await Producto.findOne({
    where: { id: resolvedProductId, tiendaId: store.id }
  });

  if (!product) {
    const error = new Error('Producto no encontrado en la tienda.');
    error.status = 404;
    throw error;
  }

  const relatedOrderItems = await OrdenProducto.count({ where: { productoId: product.id } });
  if (relatedOrderItems > 0) {
    const error = new Error('No se puede eliminar el producto porque está asociado a pedidos.');
    error.status = 409;
    throw error;
  }

  const plainProduct = product.get ? product.get({ plain: true }) : product;

  await product.destroy();

  return mapProduct(plainProduct, {
    id: store.id,
    nombreOrigen: store.nombreOrigen || store.name || ''
  });
}

module.exports = {
  listStores,
  createStore,
  createProduct,
  deleteStore,
  deleteProduct,
  getStore,
  getProduct,
  mapStore,
  mapProduct
};
