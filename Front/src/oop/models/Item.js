export default class Item {
  constructor(id, name, price, desc = "", qty = 1) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.desc = desc;
    this.qty = qty;
  }
  total() { return this.price * this.qty; }
}
