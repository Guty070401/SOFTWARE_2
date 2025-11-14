const request = require("supertest");
const express = require("express");

jest.mock("../../src/data/database", () => {
  const from = jest.fn(() => ({
    select: () => ({
      limit: () => Promise.resolve({ data: [{ id: 1 }], error: null }),
    }),
  }));
  return { supabase: { from } };
});

const mockRouter = (name) => {
  const router = express.Router();
  router.get("/ping", (_req, res) => res.json({ route: name }));
  return router;
};

jest.mock("../../src/routes/authRoutes", () => mockRouter("auth"));
jest.mock("../../src/routes/userRoutes", () => mockRouter("users"));
jest.mock("../../src/routes/storeRoutes", () => mockRouter("stores"));
jest.mock("../../src/routes/orderRoutes", () => mockRouter("orders"));
jest.mock("../../src/routes/catalogRoutes", () => mockRouter("catalog"));

const app = require("../../src/app");
const { supabase } = require("../../src/data/database");

describe("app wiring", () => {
  it("mounts feature routers under /api prefix", async () => {
    const assertions = [
      ["/api/auth/ping", "auth"],
      ["/api/users/ping", "users"],
      ["/api/stores/ping", "stores"],
      ["/api/orders/ping", "orders"],
      ["/api/catalog/ping", "catalog"],
    ];

    for (const [path, expected] of assertions) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ route: expected });
    }
  });

  it("exposes /debug/db success path", async () => {
    const res = await request(app).get("/debug/db");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, data: [{ id: 1 }] });
    expect(supabase.from).toHaveBeenCalledWith("tiendas");
  });

  it("returns 500 when supabase fails", async () => {
    supabase.from.mockImplementationOnce(() => ({
      select: () => ({
        limit: () => Promise.resolve({ data: null, error: { message: "boom" } }),
      }),
    }));

    const res = await request(app).get("/debug/db");
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
