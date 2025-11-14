import Item from "../../src/oop/models/Item";
import Order from "../../src/oop/models/Order";
import User from "../../src/oop/models/User";
import OrderStatus, { statusLabel } from "../../src/oop/models/OrderStatus";

describe("Domain models", () => {
  it("computes totals for Item instances", () => {
    const item = new Item("p1", "Burger", 12.5, "desc", null, 2);
    expect(item.total()).toBeCloseTo(25);

    item.qty = 3;
    expect(item.total()).toBeCloseTo(37.5);
  });

  it("derives totals and allows fluent status updates in Order", () => {
    const items = [new Item("p1", "Burger", 10, "", null, 1), new Item("p2", "Fries", 5, "", null, 2)];
    const order = new Order("ord-1", items);
    expect(order.total).toBe(20);
    const returned = order.setStatus(OrderStatus.DELIVERED);
    expect(returned).toBe(order);
    expect(order.status).toBe(OrderStatus.DELIVERED);
  });

  it("updates user role through setRole()", () => {
    const user = new User("u1", "Alice", "customer", "alice@example.com");
    const chained = user.setRole("courier");
    expect(chained).toBe(user);
    expect(user.role).toBe("courier");
  });

  it("normalizes labels with statusLabel helper", () => {
    expect(statusLabel("pending")).toBe("Pendiente");
    expect(statusLabel("En CAMINO")).toBe("En camino");
    expect(statusLabel("unknown")).toBe("unknown");
    expect(statusLabel(null)).toBe("");
  });
});
