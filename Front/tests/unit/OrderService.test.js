import { describe, it, expect, vi, beforeEach } from "vitest";
import OrderService from "../../src/oop/services/OrderService";

const apiMocks = {
  post: vi.fn(),
  patch: vi.fn(),
  get: vi.fn(),
};

vi.mock("../../src/oop/services/ApiClient.js", () => ({
  default: vi.fn(() => apiMocks),
}));

const resetMocks = () => {
  apiMocks.post.mockReset();
  apiMocks.patch.mockReset();
  apiMocks.get.mockReset();
};

describe("OrderService", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("builds payload when placing orders", async () => {
    apiMocks.post.mockResolvedValue({ order: { id: "ord-10" } });
    const service = new OrderService();
    const cart = [
      { id: "p1", qty: 2, storeId: "store-1" },
      { id: "p2", qty: 1 },
    ];

    const order = await service.placeOrder(cart);

    expect(apiMocks.post).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        storeId: "store-1",
        items: expect.arrayContaining([
          expect.objectContaining({ productoId: "p1", cantidad: 2 }),
          expect.objectContaining({ productoId: "p2", cantidad: 1 }),
        ]),
      })
    );
    expect(order).toEqual({ id: "ord-10" });
  });

  it("throws when cart is empty", async () => {
    const service = new OrderService();
    await expect(service.placeOrder([])).rejects.toThrow(/carrito/i);
  });

  it("retries status updates with multiple payload shapes", async () => {
    const service = new OrderService();
    const order = { id: "ord-20", status: "pending" };
    apiMocks.patch
      .mockRejectedValueOnce(new Error("bad request"))
      .mockResolvedValueOnce(undefined);

    await service.updateStatus(order, "Delivered");

    expect(apiMocks.patch).toHaveBeenCalledTimes(2);
    expect(apiMocks.patch.mock.calls[0][0]).toContain("/api/orders/ord-20");
    expect(order.status).toBe("delivered");
  });

  it("lists and fetches orders handling different payloads", async () => {
    const service = new OrderService();
    apiMocks.get.mockResolvedValueOnce({ orders: [{ id: 1 }] });
    const list = await service.list();
    expect(list).toEqual([{ id: 1 }]);

    apiMocks.get.mockResolvedValueOnce({ order: { id: 9 } });
    const order = await service.getById(9);
    expect(order).toEqual({ id: 9 });
  });
});
