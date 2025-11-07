export default class Item {

  constructor(id, name, price, desc = "", image = null, qty = 1, meta = {}) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.desc = desc;
    this.image = image;
    this.qty = qty;
    if (meta && typeof meta === "object") {
      Object.assign(this, meta);
    }
  }
  total() { return Number(this.price || 0) * (this.qty ?? 1); }
}
