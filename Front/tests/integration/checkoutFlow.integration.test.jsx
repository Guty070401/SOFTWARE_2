import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import appState from "../../src/oop/state/AppState";
import CheckoutController from "../../src/oop/controllers/CheckoutController";

describe("Checkout flow (integration)", () => {
  beforeEach(() => {
    appState.cart = [{ id: 1, name: "Combo", price: 12, qty: 1 }];
    appState.orders = [];
    appState.orderSrv = {
      placeOrder: vi.fn().mockResolvedValue({ id: 7, items: [{ id: 1, price: 12, qty: 1 }] }),
      getById: vi.fn().mockResolvedValue({ id: 7, status: "pending" }),
      list: vi.fn().mockResolvedValue([]),
    };
    appState.auth = { login: vi.fn(), register: vi.fn() };
    localStorage.setItem("token", "xyz");
    CheckoutController.instance = null;
  });

  afterEach(() => {
    CheckoutController.instance = null;
    appState.clearCart();
  });

  it("places an order, clears cart and stores normalized data", async () => {
    const controller = CheckoutController.getInstance();
    controller.initialize({ location: {}, navigate: vi.fn() });

    await controller.pay({ event: { preventDefault: () => {} }, navigate: vi.fn() });

    expect(appState.orderSrv.placeOrder).toHaveBeenCalled();
    expect(appState.orders).toHaveLength(1);
    expect(appState.cart).toHaveLength(0);
    expect(controller.getState().error).toBe("");
  });
});
