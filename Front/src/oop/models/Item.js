export default class Item {
  constructor(id, name, price, desc = "", image = null, qty = 1, storeId = null) {
    this.id = id;
    this.name = name;
    this.price = Number(price ?? 0);
    this.desc = desc;
    this.image = image;
    this.qty = qty;
    this.storeId = storeId;
  }

  total() {
    return this.price * (this.qty ?? 1);
  }
}
