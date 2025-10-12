import ApiClient from "./ApiClient.js";
import Order from "../models/Order.js";
import OrderStatus from "../models/OrderStatus.js";

export default class OrderService {
  constructor(){ this.api = new ApiClient(); }

  async placeOrder(items){
    const o = new Order(Date.now().toString(), items);
    await this.api.post("/orders", o);
    return o;
  }
  async updateStatus(order, status){
    order.setStatus(status);
    await this.api.post(`/orders/${order.id}/status`, { status });
    return order;
  }
  steps(){ return [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PICKED, OrderStatus.ON_ROUTE, OrderStatus.DELIVERED]; }
}
