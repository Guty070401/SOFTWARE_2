export default class Item {

  constructor(id, name, price, desc = "", image = null, qty = 1, storeId = null, storeName = "") {
    this.id = id;
    this.name = name;
    this.price = price;
    this.desc = desc;
    this.image = image;
    this.qty = qty;
    this.storeId = storeId;
    this.storeName = storeName;
  }

  total() {
    return this.price * (this.qty ?? 1);
  }
}
