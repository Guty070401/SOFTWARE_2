import OrderStatus from "./OrderStatus";
export default class Order {
  constructor(id, items = [], status = OrderStatus.PENDING, total = 0) {
    this.id = id;
    this.items = items;
    this.status = status;
    this.total = total || items.reduce((a,i)=>a+(i.price*(i.qty??1)),0);
    this.createdAt = new Date();
  }
  setStatus(s) { this.status = s; return this; }
}
