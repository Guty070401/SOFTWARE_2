import { describe, it, expect, vi, beforeEach } from "vitest";
import { EVENTS } from "../../src/oop/state/events";
import OrderStatus from "../../src/oop/models/OrderStatus";
import { AppState } from "../../src/oop/state/AppState";

const createDeps = () => {
  const auth = {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };
  const orderSrv = {
    placeOrder: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    list: vi.fn(),
  };
  return { auth, orderSrv };
};

const bootstrap = () => {
  AppState.instance = null;
  const deps = createDeps();
  const app = new AppState({ ...deps, forceNew: true });
  return { app, ...deps };
};

describe("AppState", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("performs auth flows and emits events", async () => {
    const { app, auth } = bootstrap();
    const fakeUser = { id: "u1", name: "Alice", setRole: vi.fn() };
    auth.login.mockResolvedValue(fakeUser);
    auth.register.mockResolvedValue({ id: "u2", name: "Bob", setRole: vi.fn() });
    const authListener = vi.fn();
    app.on(EVENTS.AUTH_CHANGED, authListener);

    await app.login("alice@example.com", "123");
    expect(auth.login).toHaveBeenCalledWith("alice@example.com", "123");
    expect(authListener).toHaveBeenCalledWith(fakeUser);
    app.setRole("courier");
    expect(fakeUser.setRole).toHaveBeenCalledWith("courier");

    await app.register({ name: "Bob", email: "bob@example.com", password: "xyz" });
    expect(auth.register).toHaveBeenCalled();
    expect(authListener).toHaveBeenLastCalledWith(null);

    app.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(app.user).toBeNull();
  });

  it("manages cart lifecycle", () => {
    const { app } = bootstrap();
    const cartListener = vi.fn();
    app.on(EVENTS.CART_CHANGED, cartListener);

    app.addToCart({ id: "p1", price: 5 });
    expect(app.cart).toHaveLength(1);
    const cartId = app.cart[0].cartId;

    app.removeFromCart(cartId);
    expect(app.cart).toHaveLength(0);

    app.addToCart({ id: "p2", price: 1 });
    app.clearCart();
    expect(app.cart).toHaveLength(0);
    expect(cartListener).toHaveBeenCalled();
  });

  it("places orders enriching data from snapshots", async () => {
    const { app, orderSrv } = bootstrap();
    app.user = { name: "Alice" };
    app.cart = [
      { id: "p1", name: "Burger", price: 12, qty: 2, image: "burger.jpg" },
    ];
    orderSrv.placeOrder.mockResolvedValue({
      id: "ord-1",
      items: [],
      status: "pendiente",
    });
    orderSrv.getById.mockRejectedValue(new Error("network"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const order = await app.placeOrder();

    expect(orderSrv.placeOrder).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ extraPayload: {} })
    );
    expect(order.items[0]).toMatchObject({ id: "p1", qty: 2, name: "Burger" });
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.total).toBeCloseTo(24);
    expect(order.customerName).toBe("Alice");
    expect(app.cart).toHaveLength(0);
    expect(app.orders).toHaveLength(1);
    warn.mockRestore();
  });

  it("fills existing items when backend returns richer data", async () => {
    const { app, orderSrv } = bootstrap();
    app.user = { name: "Lara" };
    app.cart = [
      { id: "p1", name: "Wrap", price: 10, qty: 2 },
    ];
    orderSrv.placeOrder.mockResolvedValue({
      id: "ord-merge",
      items: [{ id: "p1", cantidad: 2, precio: 3 }],
      status: "aceptado",
      total: 0,
    });
    orderSrv.getById.mockResolvedValue({
      status: "delivered",
      items: [{ productoId: "p1", qty: 2, precio: 3 }],
    });

    const order = await app.placeOrder();

    expect(order.items[0]).toMatchObject({ name: "Wrap", qty: 2, price: 3 });
    expect(order.total).toBe(6);
    expect(order.customerName).toBe("Lara");
  });

  it("applies backend details and normalizes items already present", async () => {
    const { app, orderSrv } = bootstrap();
    app.user = { name: "Fiona" };
    app.cart = [{ id: "p1", name: "Wrap", price: 10, qty: 1 }];
    orderSrv.placeOrder.mockResolvedValue({
      id: "ord-merge",
      items: [{ productoId: "p1", qty: null, name: null }],
      status: "aceptado",
      total: null,
    });
    orderSrv.getById.mockResolvedValue({
      status: "delivered",
      items: [{ id: "p_api", precio: 15, cantidad: 2 }],
    });

    const order = await app.placeOrder();

    expect(orderSrv.getById).toHaveBeenCalledWith("ord-merge");
    expect(order.items[0]).toMatchObject({ id: "p_api", price: 15, qty: 2 });
    expect(order.status).toBe(OrderStatus.DELIVERED);
    expect(order.total).toBeCloseTo(30);
  });

  it("updates status and refreshes data from backend", async () => {
    const { app, orderSrv } = bootstrap();
    const order = { id: "ord-2", status: "created" };
    app.orders = [order];
    orderSrv.updateStatus.mockResolvedValue(order);
    orderSrv.getById.mockResolvedValue({ status: "ENTREGADO" });

    const updated = await app.updateStatus("ord-2", "delivered");

    expect(orderSrv.updateStatus).toHaveBeenCalledWith(order, "delivered");
    expect(orderSrv.getById).toHaveBeenCalledWith("ord-2");
    expect(updated.status).toBe(OrderStatus.DELIVERED);
  });

  it("ignores updateStatus when order does not exist", async () => {
    const { app, orderSrv } = bootstrap();
    const result = await app.updateStatus("missing", "pending");
    expect(result).toBeNull();
    expect(orderSrv.updateStatus).not.toHaveBeenCalled();
  });

  it("fetches and normalizes order list", async () => {
    const { app, orderSrv } = bootstrap();
    const ordersFromApi = [
      {
        id: "ord-3",
        estado: "en camino",
        items: [{ price: 5, qty: 2 }],
        total: null,
      },
    ];
    orderSrv.list.mockResolvedValue(ordersFromApi);
    const listener = vi.fn();
    app.on(EVENTS.ORDERS_CHANGED, listener);

    const normalized = await app.fetchOrders();

    expect(orderSrv.list).toHaveBeenCalled();
    expect(normalized[0].status).toBe(OrderStatus.ON_ROUTE);
    expect(normalized[0].total).toBeCloseTo(10);
    expect(listener).toHaveBeenCalledWith(normalized);
  });

  it("normalizes fetched orders even when items or totals are missing", async () => {
    const { app, orderSrv } = bootstrap();
    orderSrv.list.mockResolvedValue([
      { id: "ord-4", status: "cancelled", items: [{ precio: 8, cantidad: 1 }], total: null },
      { id: "ord-5", status: "created", items: null, total: undefined },
    ]);

    const normalized = await app.fetchOrders();

    expect(normalized[0].status).toBe(OrderStatus.CANCELED);
    expect(normalized[0].total).toBe(8);
    expect(normalized[1].items).toEqual([]);
    expect(normalized[1].status).toBe(OrderStatus.PENDING);
  });
});
