import { describe, it, expect, beforeEach, vi } from "vitest";

const { apiMock, fetchMock } = vi.hoisted(()=> ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
  fetchMock: vi.fn(),
}));

vi.mock("../../../src/services/api.js", () => ({
  api: apiMock,
}));

global.fetch = fetchMock;

describe("store service wrappers", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(apiMock).forEach((fn)=> fn.mockReset());
    fetchMock.mockReset();
    localStorage.clear();
    vi.stubEnv("VITE_API_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("delegates CRUD operations to api helper", async () => {
    const { StoresApi } = await import("../../../src/services/storeService.js");
    await StoresApi.list();
    expect(apiMock.get).toHaveBeenCalledWith("/api/stores");
    await StoresApi.create({ name: "Store" });
    expect(apiMock.post).toHaveBeenCalledWith("/api/stores", { name: "Store" });
    await StoresApi.update("s1", { name: "New" });
    expect(apiMock.patch).toHaveBeenCalledWith("/api/stores/s1", { name: "New" });
    await StoresApi.remove("s1");
    expect(apiMock.del).toHaveBeenCalledWith("/api/stores/s1");
  });

  it("calls fetch for export endpoints attaching token", async () => {
    localStorage.setItem("token", "abc");
    const blob = new Blob(["{}"], { type: "application/json" });
    fetchMock.mockResolvedValue({ blob: () => Promise.resolve(blob) });
    const { StoresApi, OrdersApi } = await import("../../../src/services/storeService.js");

    const storesBlob = await StoresApi.exportJSON();
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/stores/export/json", expect.objectContaining({
      headers: { Authorization: "Bearer abc" },
    }));
    expect(storesBlob).toBe(blob);

    fetchMock.mockResolvedValueOnce({ blob: () => Promise.resolve(blob) });
    const ordersBlob = await OrdersApi.exportJSON();
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/orders/export/json", expect.objectContaining({
      headers: { Authorization: "Bearer abc" },
    }));
    expect(ordersBlob).toBe(blob);
  });
});
