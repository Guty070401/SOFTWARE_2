import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthService from "../../../src/oop/services/AuthService.js";
import User from "../../../src/oop/models/User.js";

const backend = vi.hoisted(()=> ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../../src/services/authService", () => ({
  login: backend.login,
  register: backend.register,
  logout: backend.logout,
}));

describe("OOP AuthService adapter", () => {
  beforeEach(() => {
    Object.values(backend).forEach((fn)=> fn.mockReset());
  });

  it("maps login responses into User entities", async () => {
    backend.login.mockResolvedValueOnce({
      id: "user-1",
      nombre: "Ada",
      rol: "courier",
      correo: "ada@example.com",
    });
    const service = new AuthService();

    const user = await service.login("ada@example.com", "secret");

    expect(backend.login).toHaveBeenCalledWith({ correo: "ada@example.com", password: "secret" });
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchObject({ id: "user-1", name: "Ada", role: "courier", email: "ada@example.com" });
  });

  it("registers users applying defaults when backend omits data", async () => {
    backend.register.mockResolvedValueOnce({
      id: "user-2",
      nombre_usuario: "Bob",
    });
    const service = new AuthService();

    const user = await service.register({ name: "Bob", email: "bob@example.com", password: "pw", celular: "999999999" });

    expect(backend.register).toHaveBeenCalledWith({
      nombre: "Bob",
      correo: "bob@example.com",
      password: "pw",
      celular: "999999999",
      rol: "customer",
    });
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchObject({ name: "Bob", role: "customer", email: "bob@example.com" });
  });

  it("logs out via backend adapter", () => {
    const service = new AuthService();
    service.logout();
    expect(backend.logout).toHaveBeenCalled();
  });
});
