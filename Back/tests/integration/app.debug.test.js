const request = require("supertest");

jest.mock("../../src/data/database", () => {
  const limit = jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
  const select = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ select }));

  const supabase = { from };
  return { supabase };
});

const app = require("../../src/app");
const { supabase } = require("../../src/data/database");

describe("GET /debug/db", () => {
  it("returns ok when supabase responds", async () => {
    const res = await request(app).get("/debug/db");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith("tiendas");
  });

  it("returns 500 when supabase reports an error", async () => {
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
