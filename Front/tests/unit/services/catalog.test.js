import { describe, it, expect, vi, beforeEach } from "vitest";

const { apiMock } = vi.hoisted(()=> ({
  apiMock: {
    post: vi.fn(),
  },
}));

vi.mock("../../../src/services/api.js", () => ({
  api: apiMock,
}));

describe("catalog service", () => {
  beforeEach(() => {
    vi.resetModules();
    apiMock.post.mockReset();
  });

  it("exposes the seed catalog and calls backend sync", async () => {
    const { seedCatalog, syncCatalog } = await import("../../../src/services/catalog.js");
    apiMock.post.mockResolvedValueOnce({ synced: true });
    const response = await syncCatalog();
    expect(Array.isArray(seedCatalog)).toBe(true);
    expect(seedCatalog.length).toBeGreaterThan(0);
    expect(apiMock.post).toHaveBeenCalledWith("/api/catalog/sync", { catalog: seedCatalog });
    expect(response).toEqual({ synced: true });
  });
});
