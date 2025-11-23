import { describe, it, expect, vi, beforeEach } from "vitest";

const { apiMock, setTokenMock, clearTokenMock } = vi.hoisted(() => ({
  apiMock: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setTokenMock: vi.fn(),
  clearTokenMock: vi.fn(),
}));

vi.mock("../../../src/services/api.js", () => ({
  api: apiMock,
  setToken: setTokenMock,
  clearToken: clearTokenMock,
}));

describe("authService facade", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(apiMock).forEach((fn) => fn.mockReset());
    setTokenMock.mockReset();
    clearTokenMock.mockReset();
  });

  it("registers users without storing token until verification", async () => {
    apiMock.post.mockResolvedValueOnce({ user: { id: 1 }, token: "t1" });
    const service = await import("../../../src/services/authService.js");
    const user = await service.register({ nombre: "Ada", correo: "ada@example.com", password: "123" });
    expect(apiMock.post).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({ nombre: "Ada" })
    );
    expect(setTokenMock).not.toHaveBeenCalled();
    expect(user).toEqual({ id: 1 });
  });

  it("logs in and retrieves profile", async () => {
    apiMock.post.mockResolvedValueOnce({ user: { id: 2 }, token: "abc" });
    apiMock.get.mockResolvedValueOnce({ id: 2 });
    const service = await import("../../../src/services/authService.js");
    const user = await service.login({ correo: "user@example.com", password: "pw" });
    expect(apiMock.post).toHaveBeenCalledWith("/api/auth/login", { correo: "user@example.com", password: "pw" });
    expect(setTokenMock).toHaveBeenCalledWith("abc");
    expect(user).toEqual({ id: 2 });

    const me = await service.me();
    expect(apiMock.get).toHaveBeenCalledWith("/api/auth/me");
    expect(me).toEqual({ id: 2 });
  });

  it("clears token on logout", async () => {
    const service = await import("../../../src/services/authService.js");
    service.logout();
    expect(clearTokenMock).toHaveBeenCalled();
  });
});
