const orderController = require("../../src/controllers/orderController");
const orderService = require("../../src/services/orderService");

jest.mock("../../src/services/orderService", () => ({
  listOrdersForUser: jest.fn(),
  createOrder: jest.fn(),
  getOrderByIdForUser: jest.fn(),
  updateStatus: jest.fn(),
}));

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

describe("orderController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder validations", () => {
    const baseReq = {
      body: { storeId: "store-1", items: [{ id: "p1", qty: 1, price: 4 }] },
      userEntity: { id: "user-1" },
    };

    it.each([
      ["missing storeId", { ...baseReq, body: { items: [{ id: "p1" }] } }, /storeId/],
      ["empty items", { ...baseReq, body: { storeId: "store-1", items: [] } }, /items/],
      ["item without product id", { ...baseReq, body: { storeId: "store-1", items: [{ qty: 1 }] } }, /productoId/],
      ["item with invalid quantity", { ...baseReq, body: { storeId: "store-1", items: [{ id: "p1", cantidad: 0 }] } }, /cantidad/],
      ["item with invalid price", { ...baseReq, body: { storeId: "store-1", items: [{ id: "p1", qty: 1, price: "foo" }] } }, /precio/],
    ])("returns 400 when %s", async (_, req, message) => {
      const res = createRes();
      const next = jest.fn();

      await orderController.createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(message) }));
      expect(orderService.createOrder).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  it("creates order with normalized payload", async () => {
    const req = {
      body: {
        storeId: "store-9",
        items: [
          { productId: "p1", quantity: "2", price: "10" },
          { id: "p2", qty: 1, price: 5 },
        ],
        notes: "apurar",
        direccion: "Calle 1",
      },
      userEntity: { id: "user-9" },
    };
    const res = createRes();
    const next = jest.fn();
    const fakeOrder = { id: "ord-1" };
    orderService.createOrder.mockResolvedValue(fakeOrder);

    await orderController.createOrder(req, res, next);

    expect(orderService.createOrder).toHaveBeenCalledTimes(1);
    const payload = orderService.createOrder.mock.calls[0][0];
    expect(payload.customerId).toBe("user-9");
    expect(payload.items).toEqual([
      { productoId: "p1", cantidad: 2, precio: 10 },
      { productoId: "p2", cantidad: 1, precio: 5 },
    ]);
    expect(payload.direccionEntrega).toBe("Calle 1");
    expect(payload.comentarios).toBe("apurar");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ order: fakeOrder });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns list of orders for authenticated user", async () => {
    const req = { userEntity: { id: "user-1" } };
    const res = createRes();
    const next = jest.fn();
    orderService.listOrdersForUser.mockResolvedValue([{ id: "ord-1" }]);

    await orderController.listOrders(req, res, next);

    expect(orderService.listOrdersForUser).toHaveBeenCalledWith(req.userEntity);
    expect(res.json).toHaveBeenCalledWith({ orders: [{ id: "ord-1" }] });
    expect(next).not.toHaveBeenCalled();
  });

  it("delegates to next handler when listOrders fails", async () => {
    const error = new Error("boom");
    orderService.listOrdersForUser.mockRejectedValue(error);
    const req = { userEntity: {} };
    const res = createRes();
    const next = jest.fn();

    await orderController.listOrders(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("gets an order by id", async () => {
    const req = { params: { orderId: "ord-2" }, userEntity: { id: "user-2" } };
    const res = createRes();
    const next = jest.fn();
    const order = { id: "ord-2" };
    orderService.getOrderByIdForUser.mockResolvedValue(order);

    await orderController.getOrder(req, res, next);

    expect(orderService.getOrderByIdForUser).toHaveBeenCalledWith("ord-2", req.userEntity);
    expect(res.json).toHaveBeenCalledWith({ order });
  });

  it("updates order status", async () => {
    const req = {
      params: { orderId: "ord-3" },
      userEntity: { id: "user-3" },
      body: { status: "accepted", notes: "ok" },
    };
    const res = createRes();
    const next = jest.fn();
    const order = { id: "ord-3", status: "accepted" };
    orderService.updateStatus.mockResolvedValue(order);

    await orderController.updateStatus(req, res, next);

    expect(orderService.updateStatus).toHaveBeenCalledWith("ord-3", req.userEntity, "accepted", "ok");
    expect(res.json).toHaveBeenCalledWith({ order });
  });
});
