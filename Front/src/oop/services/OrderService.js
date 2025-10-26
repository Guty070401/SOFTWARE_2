import ApiClient from "./ApiClient.js";
import OrderStatus from "../models/OrderStatus.js";

function resolveStoreId(cart, provided){
  if (provided) return provided;
  const first = cart?.[0];
  return first?.storeId || first?.tiendaId || null;
}

function normaliseItem(item, fallbackStore){
  if (!item) return null;
  return {
    id: item.id || item.productoId || item.productId,
    name: item.name || item.nombre || "Producto",
    price: Number(item.price ?? item.precio ?? item.precioUnitario ?? 0),
    qty: item.qty ?? item.quantity ?? item.cantidad ?? 1,
    image: item.image || item.foto || null,
    storeId: fallbackStore?.id || item.storeId || null,
    storeName: fallbackStore?.name || item.storeName || null
  };
}

function normaliseOrder(order){
  if (!order) return null;
  const storeInfo = order.store ? {
    id: order.store.id || order.store.tiendaId || null,
    name: order.store.nombre || order.store.name || null
  } : null;
  return {
    ...order,
    id: order.id,
    status: order.status || order.estado || OrderStatus.PENDING,
    total: Number(order.total ?? 0),
    items: Array.isArray(order.items) ? order.items.map((item) => normaliseItem(item, storeInfo)).filter(Boolean) : [],
    store: order.store || null
  };
}

export default class OrderService {
  constructor(){
    this.api = new ApiClient();
  }

  async listOrders(){
    const result = await this.api.get("/orders");
    return Array.isArray(result.orders) ? result.orders.map(normaliseOrder) : [];
  }

  async placeOrder(cart, { storeId, address, notes } = {}){
    if (!Array.isArray(cart) || cart.length === 0){
      throw new Error("El carrito está vacío");
    }

    const resolvedStoreId = resolveStoreId(cart, storeId);
    if (!resolvedStoreId){
      throw new Error("No se pudo determinar la tienda del pedido");
    }

    const inconsistentStore = cart.some((item) => {
      const itemStore = item.storeId || item.tiendaId;
      return itemStore && itemStore !== resolvedStoreId;
    });
    if (inconsistentStore){
      throw new Error("El pedido solo puede incluir productos de una misma tienda");
    }

    const items = cart.map((item) => ({
      productoId: item.productoId || item.productId || item.id,
      cantidad: item.qty ?? item.quantity ?? 1
    }));

    const payload = {
      storeId: resolvedStoreId,
      items
    };

    if (address) payload.direccion = address;
    if (notes) payload.comentarios = notes;

    const result = await this.api.post("/orders", payload);
    return normaliseOrder(result.order);
  }

  async updateStatus(order, status, notes = ""){
    const orderId = typeof order === "object" ? order.id : order;
    const result = await this.api.patch(`/orders/${orderId}/status`, { status, notes });
    return normaliseOrder(result.order);
  }

  steps(){
    return [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKED,
      OrderStatus.ON_ROUTE,
      OrderStatus.DELIVERED
    ];
  }
}
