import ApiClient from "./ApiClient.js";
import Order from "../models/Order.js";
import OrderStatus from "../models/OrderStatus.js";

export default class OrderService {
  constructor(){ this.api = new ApiClient(); }

  async placeOrder(cart, totalOverride = null) {
  const total = totalOverride ?? cart.reduce((a, i) => a + i.price * (i.qty ?? 1), 0);
  const order = {
    id: Date.now(),
    items: [...cart],
    total,
    status: "pendiente",
  };
  // Aquí puedes simular guardarlo o retornarlo
  return order;
}

  steps(){ return [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PICKED, OrderStatus.ON_ROUTE, OrderStatus.DELIVERED]; }
}
