import OrderStatus from "./OrderStatus.js";

export default class Order {
  constructor(idOrDto, items = [], status = OrderStatus.PENDING, total = 0) {
    if (typeof idOrDto === "object" && idOrDto !== null && !Array.isArray(idOrDto)) {
      const dto = idOrDto;
      this.id = dto.id ?? "";
      this.items = Array.isArray(dto.items)
        ? dto.items.map((item) => {
            const qty = Number(item.qty ?? item.cantidad ?? item.quantity ?? 1) || 1;
            const price = Number(item.price ?? item.precio ?? 0) || 0;
            const subtotal = Number(item.subtotal ?? item.subTotal ?? price * qty) || price * qty;
            return { ...item, qty, price, subtotal };
          })
        : [];
      this.status = dto.status ?? dto.estado ?? OrderStatus.PENDING;
      this.total = Number(dto.total ?? 0) || 0;
      this.store = dto.store ?? null;
      this.history = Array.isArray(dto.history) ? dto.history : [];
      this.address = dto.address ?? dto.direccionEntrega ?? "";
      this.notes = dto.notes ?? dto.comentarios ?? "";
      this.tracking = dto.tracking ?? null;
      this.createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();
    } else {
      this.id = idOrDto;
      this.items = items;
      this.status = status;
      this.total = total || items.reduce((acc, item) => acc + Number(item.price ?? 0) * (item.qty ?? 1), 0);
      this.store = null;
      this.history = [];
      this.address = "";
      this.notes = "";
      this.tracking = null;
      this.createdAt = new Date();
    }
  }

  setStatus(status) {
    this.status = status;
    return this;
  }
}
