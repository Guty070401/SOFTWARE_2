import { describe, it, expect, beforeEach } from "vitest";
import { useOrderStore } from "../../../src/store/useOrderStore.js";

describe("useOrderStore", () => {
  beforeEach(() => {
    useOrderStore.setState({ cart: [], orders: [] });
  });

  it("adds, removes and clears cart items", () => {
    useOrderStore.getState().addToCart({ id: "p1", qty: 1 });
    useOrderStore.getState().addToCart({ id: "p1" });
    expect(useOrderStore.getState().cart[0].qty).toBe(2);
    useOrderStore.getState().removeFromCart("p1");
    expect(useOrderStore.getState().cart[0].qty).toBe(1);
    useOrderStore.getState().clearCart();
    expect(useOrderStore.getState().cart).toHaveLength(0);
  });

  it("places orders and updates status", () => {
    useOrderStore.setState({ cart: [{ id: "p2", qty: 1 }], orders: [] });
    useOrderStore.getState().placeOrder(10);
    expect(useOrderStore.getState().orders).toHaveLength(1);
    const { id } = useOrderStore.getState().orders[0];
    useOrderStore.getState().updateStatus(id, "delivered");
    expect(useOrderStore.getState().orders[0].status).toBe("delivered");
  });
});
