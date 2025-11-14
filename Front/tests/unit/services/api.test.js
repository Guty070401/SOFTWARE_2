import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("services/api", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    localStorage.clear();
  });

  const buildResponse = ({ ok = true, data = {}, status = 200, contentType = "application/json" } = {})=> ({
    ok,
    status,
    headers: {
      get: () => contentType,
    },
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(typeof data === "string" ? data : JSON.stringify(data)),
  });

  it("sets and clears token in localStorage", async () => {
    const apiModule = await import("../../../src/services/api.js");
    apiModule.setToken("abc");
    expect(localStorage.getItem("token")).toBe("abc");
    apiModule.clearToken();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("performs JSON requests and returns parsed data", async () => {
    const apiModule = await import("../../../src/services/api.js");
    mockFetch.mockResolvedValueOnce(buildResponse({ data: { hello: "world" } }));
    const result = await apiModule.api.get("/ping");
    expect(result).toEqual({ hello: "world" });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/ping"), expect.objectContaining({ method: "GET" }));
  });

  it("throws when the response is not ok", async () => {
    const apiModule = await import("../../../src/services/api.js");
    mockFetch.mockResolvedValueOnce(buildResponse({ ok: false, data: { message: "Boom" }, status: 500 }));
    await expect(apiModule.api.get("/boom")).rejects.toThrow("Boom");
  });

  it("includes token header when available", async () => {
    const apiModule = await import("../../../src/services/api.js");
    apiModule.setToken("secure");
    mockFetch.mockResolvedValueOnce(buildResponse({ data: { ok: true } }));
    await apiModule.api.post("/secure", { foo: "bar" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer secure");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ foo: "bar" }));
  });
});
