const request = require("supertest");
const app = require("../../src/app");

describe("Orders API auth (functional)", () => {
  it("rejects order creation without JWT", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ storeId: 1, items: [{ productoId: 10, cantidad: 1, precioUnitario: 5 }] });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });
});
