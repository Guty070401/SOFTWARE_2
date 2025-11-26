jest.mock("../../src/utils/id", () => {
  let counter = 0;
  return {
    generateId: (prefix = "id_") => `${prefix}${++counter}`,
  };
});

jest.mock("bcrypt", () => ({
  hash: jest.fn(async (value) => `hashed:${value}`),
  compare: jest.fn(async (value, hash) => hash === `hashed:${value}`),
}));

const { ORDER_STATUS, ORDER_STATUS_FLOW, isValidOrderStatus } = require("../../src/constants/orderStatus");
const HistorialEstado = require("../../src/models/HistorialEstado");
const Orden = require("../../src/models/Orden");
const OrdenProducto = require("../../src/models/OrdenProducto");
const OrdenUsuario = require("../../src/models/OrdenUsuario");
const Producto = require("../../src/models/Producto");
const Tarjeta = require("../../src/models/Tarjeta");
const Tienda = require("../../src/models/Tienda");
const Usuario = require("../../src/models/Usuario");

describe("Domain constants", () => {
  it("exposes status flow and validator", () => {
    expect(ORDER_STATUS_FLOW).toEqual({
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PICKED, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.PICKED]: [ORDER_STATUS.ON_ROUTE, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.ON_ROUTE]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.CANCELED]: [],
      [ORDER_STATUS.DELIVERED]: [],
    });

    Object.values(ORDER_STATUS).forEach((status) => {
      expect(isValidOrderStatus(status)).toBe(true);
    });
    expect(isValidOrderStatus("made_up_status")).toBe(false);
  });
});

describe("Models", () => {
  it("creates HistorialEstado entries normalizing dates", () => {
    const entry = new HistorialEstado({
      ordenId: "ord-1",
      estado: ORDER_STATUS.ACCEPTED,
      comentarios: "ok",
      hora: "2024-01-01T10:00:00Z",
    });

    expect(entry.id).toMatch(/^ord_hist_/);
    expect(entry.hora).toBeInstanceOf(Date);
    expect(entry.toJSON()).toEqual({
      id: entry.id,
      ordenId: "ord-1",
      estado: ORDER_STATUS.ACCEPTED,
      comentarios: "ok",
      hora: "2024-01-01T10:00:00.000Z",
    });
  });

  it("handles Orden lifecycle (items + historial)", () => {
    const order = new Orden({
      tiendaId: "store-1",
      fecha: "2024-02-02T00:00:00Z",
      hora: "2024-02-02T12:00:00Z",
      direccionEntrega: "Av 1",
    });

    const item = new OrdenProducto({
      ordenId: order.id,
      productoId: "prd-1",
      cantidad: "3",
      precioUnitario: "12.5",
    });
    expect(item.subtotal()).toBe(37.5);
    expect(item.toJSON()).toEqual({
      productoId: "prd-1",
      cantidad: 3,
      precioUnitario: 12.5,
      subtotal: 37.5,
    });

    order.addItem(item);
    expect(order.items).toHaveLength(1);
    expect(order.total).toBe(37.5);

    const historial = new HistorialEstado({
      ordenId: order.id,
      estado: ORDER_STATUS.ON_ROUTE,
    });
    order.addHistorial(historial);
    expect(order.historial).toHaveLength(1);
    expect(order.estado).toBe(ORDER_STATUS.ON_ROUTE);

    const snapshot = order.toJSON();
    expect(snapshot.id).toBe(order.id);
    expect(snapshot.estado).toBe(ORDER_STATUS.ON_ROUTE);
    expect(snapshot.tracking).toBe(order.tracking);
    expect(snapshot.total).toBe(37.5);
    expect(snapshot.direccionEntrega).toBe("Av 1");
  });

  it("matches OrdenUsuario pairs and handles Producto serialization", () => {
    const link = new OrdenUsuario({ ordenId: "ord-9", usuarioId: "usr-9", esPropietario: true });
    expect(link.matches("ord-9", "usr-9")).toBe(true);
    expect(link.matches("ord-9", "usr-x")).toBe(false);

    const product = new Producto({
      nombre: "Hamburguesa",
      descripcion: "doble",
      foto: "foto.jpg",
      tiendaId: "store-2",
      precio: "20.5",
    });

    expect(product.precio).toBe(20.5);
    expect(product.toJSON()).toEqual({
      id: product.id,
      nombre: "Hamburguesa",
      descripcion: "doble",
      foto: "foto.jpg",
      tiendaId: "store-2",
      precio: 20.5,
    });
  });

  it("manages Tarjeta lifecycle (mask, expiration, invalidation)", () => {
    const expiration = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const card = new Tarjeta({
      numeroTarjeta: "4111 5555 6666 7777",
      vencimiento: expiration,
      csv: "123",
      titulo: "Mi Visa",
    });
    expect(card.getMaskedNumber().endsWith("7777")).toBe(true);
    expect(card.isExpired(new Date(expiration.getTime() - 1))).toBe(false);
    expect(card.isExpired(new Date(expiration.getTime() + 1))).toBe(true);
    card.invalidateCard();
    expect(card.invalidada).toBe(true);
    expect(card.toJSON()).toEqual({
      id: card.id,
      titulo: "Mi Visa",
      numero: card.getMaskedNumber(),
      vencimiento: expiration.toISOString(),
      foto: null,
      invalidada: true,
    });
  });

  it("updates Tienda inventory set", () => {
    const store = new Tienda({ nombreOrigen: "Bembos", logo: "logo.png" });
    store.agregarProducto("prd-1");
    store.agregarProducto("prd-2");
    expect(store.productos.has("prd-1")).toBe(true);
    store.eliminarProducto("prd-1");
    expect(store.productos.has("prd-1")).toBe(false);
    expect(store.toJSON()).toEqual({ id: store.id, nombre: "Bembos", logo: "logo.png" });
  });

  it("supports Usuario auth helpers and collections", async () => {
    const user = await Usuario.createWithPassword({
      nombreUsuario: "Ana",
      correo: "ANA@MAIL.COM",
      password: "super-secret",
    });
    expect(user.correo).toBe("ana@mail.com");

    await user.changePassword("super-secret", "new-pass");
    await expect(user.changePassword("wrong", "x")).resolves.toBe(false);

    user.iniciarSesion();
    expect(user.activo).toBe(true);
    user.cerrarSesion();
    expect(user.activo).toBe(false);

    user.cambiarModo("courier");
    expect(user.rol).toBe("courier");
    user.setRole("admin");
    expect(user.rol).toBe("admin");

    user.agregarOrden("ord-1");
    user.agregarTarjeta("card-1");
    user.removerTarjeta("card-1");
    expect(user.tarjetas.size).toBe(0);

    expect(user.toPublicJSON()).toMatchObject({
      id: user.id,
      nombre: "Ana",
      correo: "ana@mail.com",
      rol: "admin",
    });
  });
});
