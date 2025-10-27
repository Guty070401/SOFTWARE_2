// Servicio de órdenes conectado al backend
import ApiClient from "./ApiClient.js";
import Order from "../models/Order.js";

function groupCartItems(cart) {
  const accumulator = new Map();
  cart.forEach((item) => {
    if (!item || !item.id) return;
    const current = accumulator.get(item.id) || { productoId: item.id, cantidad: 0 };
    const quantity = Number(item.qty ?? 1) || 1;
    current.cantidad += quantity;
    accumulator.set(item.id, current);
  });
  return Array.from(accumulator.values());
}

export default class OrderService {
  constructor() {
    this.api = new ApiClient();
  }

  async placeOrder(cart, { storeId, address, notes, cardId } = {}) {
    const items = groupCartItems(cart);
    const payload = {
      storeId,
      items,
      direccion: address,
      comentarios: notes,
      tarjetaId: cardId,
    };

    const data = await this.api.post("/orders", payload);
    return data?.order ? new Order(data.order) : null;
  }

  async listOrders() {
    const data = await this.api.get("/orders");
    const orders = data?.orders ?? [];
    return orders.map((dto) => new Order(dto));
  }

  async getOrder(orderId) {
    const data = await this.api.get(`/orders/${orderId}`);
    return data?.order ? new Order(data.order) : null;
  }

  async updateStatus(orderId, status, notes) {
    const data = await this.api.patch(`/orders/${orderId}/status`, {
      status,
      comentarios: notes,
    });
    return data?.order ? new Order(data.order) : null;
  }

  steps() {
    return [
      "pending",
      "accepted",
      "picked",
      "on_route",
      "delivered",
    ];
  }
}
