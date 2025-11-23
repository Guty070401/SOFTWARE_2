import { describe, it, expect, vi, afterEach } from "vitest";
import CheckoutController from "../../src/oop/controllers/CheckoutController";
import { EVENTS } from "../../src/oop/state/events";

describe("CheckoutController (unit)", () => {
  const createAppState = () => {
    const listeners = new Map();
    return {
      cart: [{ id: 1, price: 10, qty: 2 }],
      placeOrder: vi.fn().mockResolvedValue({ id: 99 }),
      on: vi.fn((event, fn) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(fn);
        return () => listeners.get(event).delete(fn);
      }),
      emit(event) {
        listeners.get(event)?.forEach((fn) => fn());
      },
    };
  };

  const bootstrap = () => {
    CheckoutController.instance = null;
    const app = createAppState();
    const controller = CheckoutController.getInstance({ app });
    return { controller, app };
  };

  afterEach(() => {
    CheckoutController.instance = null;
  });

  it("uses total from navigation state when available", () => {
    const { controller } = bootstrap();
    const navigate = vi.fn();
    localStorage.setItem("token", "abc");

    controller.initialize({
      location: { state: { total: 45.5 } },
      navigate,
    });

    expect(controller.getState().total).toBe(45.5);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("computes fallback total from cart snapshot", () => {
    const { controller, app } = bootstrap();
    app.cart = [{ price: 5, qty: 3 }];
    localStorage.setItem("token", "abc");

    controller.initialize({ location: {}, navigate: vi.fn() });

    expect(controller.getState().total).toBe(15);
  });

  it("creates order and redirects on pay", async () => {
    const { controller, app } = bootstrap();
    localStorage.setItem("token", "abc");
    controller.initialize({ location: {}, navigate: vi.fn() });
    const event = { preventDefault: vi.fn() };
    const navigate = vi.fn();

    await controller.pay({ event, navigate, paymentDetails: { method: "card" } });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(app.placeOrder).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/customer/order/99", { replace: true });
    expect(controller.getState().paying).toBe(false);
  });

  it("sets error when cart is empty", async () => {
    const { controller, app } = bootstrap();
    app.cart = [];
    localStorage.setItem("token", "abc");
    controller.initialize({ location: {}, navigate: vi.fn() });

    await controller.pay({ event: { preventDefault: vi.fn() }, paymentDetails: { method: "card" } });

    expect(controller.getState().error).toMatch(/carrito/i);
  });

  it("notifies subscribers and allows unsubscribe", () => {
    const { controller } = bootstrap();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    controller.setState({ total: 77 });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ total: 77 }));
    unsubscribe();
    controller.setState({ total: 88 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("redirects to login when user is unauthenticated", () => {
    const { controller } = bootstrap();
    localStorage.removeItem("token");
    const navigate = vi.fn();
    controller.initialize({ location: {}, navigate });
    expect(navigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("handles errors while paying and resets paying flag", async () => {
    const { controller, app } = bootstrap();
    app.placeOrder.mockRejectedValueOnce(new Error("fail"));
    localStorage.setItem("token", "abc");
    controller.initialize({ location: {}, navigate: vi.fn() });
    await controller.pay({ event: { preventDefault: vi.fn() }, paymentDetails: { method: "card" } });
    expect(controller.getState().paying).toBe(false);
    expect(controller.getState().error).toMatch(/fail|m.{0,3}todo de pago/i);
  });

  it("computes totals using qty defaults", () => {
    const { controller, app } = bootstrap();
    app.cart = [
      { price: 3.5 },
      { price: "2", qty: 3 },
    ];
    expect(controller.computeCartTotal()).toBeCloseTo(3.5 + 6);
  });

  it("rebinds to cart events and recomputes totals on changes", () => {
    const { controller, app } = bootstrap();
    localStorage.setItem("token", "abc");
    controller.initialize({ location: {}, navigate: vi.fn() });
    app.cart = [{ price: 12 }];
    app.emit(EVENTS.CART_CHANGED);
    expect(controller.getState().total).toBe(12);
  });

  it("ignores non function subscribers", () => {
    const { controller } = bootstrap();
    const disposer = controller.subscribe(null);
    expect(typeof disposer).toBe("function");
    disposer();
  });
});
