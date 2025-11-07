// Servicio de pedidos conectado al backend real
import ApiClient from "./ApiClient.js";
import OrderStatus from "../models/OrderStatus.js";

export default class OrderService {
  constructor() {
    this.api = new ApiClient();
  }

  async placeOrder({ storeId, items, address, notes, cardId }) {
    const response = await this.api.post("/orders", {
      storeId,
      tiendaId: storeId,
      items,
      direccionEntrega: address,
      comentarios: notes,
      tarjetaId: cardId ?? null
    });
    return response?.order ?? null;
  }

  async listOrders() {
    const response = await this.api.get("/orders");
    return response?.orders ?? [];
  }

  async getOrder(orderId) {
    const response = await this.api.get(`/orders/${orderId}`);
    return response?.order ?? null;
  }

  async updateStatus(orderId, status, notes) {
    const response = await this.api.patch(`/orders/${orderId}/status`, {
      status,
      comentarios: notes
    });
    return response?.order ?? null;
  }

  steps() {
    return [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKED,
      OrderStatus.ON_ROUTE,
      OrderStatus.DELIVERED
    ];
  }
}
