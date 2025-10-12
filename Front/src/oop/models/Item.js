export default class Item {
  //            ↓ añade image y deja qty al final (con default = 1)
  constructor(id, name, price, desc = "", image = null, qty = 1) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.desc = desc;
    this.image = image;
    this.qty = qty;
  }
  total() { return this.price * (this.qty ?? 1); }
}
