import { describe, it, expect, vi, beforeEach } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
  },
}));

vi.mock("../../../src/services/api.js", () => ({
  api: apiMock,
}));

describe("catalog service", () => {
  beforeEach(() => {
    vi.resetModules();
    apiMock.get.mockReset();
  });

  it("calls backend sync endpoint", async () => {
    apiMock.get.mockResolvedValueOnce({ synced: true });
    const { syncCatalog } = await import("../../../src/services/catalog.js");
    const response = await syncCatalog();
    expect(apiMock.get).toHaveBeenCalledWith("/api/catalog/refresh");
    expect(response).toEqual({ synced: true });
  });
});
