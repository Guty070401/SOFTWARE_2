const authController = require("../../src/controllers/authController");
const storeController = require("../../src/controllers/storeController");
const userController = require("../../src/controllers/userController");
const authMiddleware = require("../../src/middlewares/authMiddleware");
const requireAuth = require("../../src/middlewares/requireAuth");
const requireAdmin = require("../../src/middlewares/requireAdmin");
const roleMiddleware = require("../../src/middlewares/roleMiddleware");
const errorMiddleware = require("../../src/middlewares/errorMiddleware");
const authService = require("../../src/services/authService");
const storeService = require("../../src/services/storeService");
const userService = require("../../src/services/userService");
const jwt = require("jsonwebtoken");

jest.mock("../../src/services/authService", () => ({
  register: jest.fn(),
  login: jest.fn(),
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock("../../src/services/storeService", () => ({
  listStores: jest.fn(),
}));

jest.mock("../../src/services/userService", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  listCards: jest.fn(),
  addCard: jest.fn(),
  removeCard: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

describe("Controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers users via authController", async () => {
    const req = {
      body: { name: "Ada", email: "ada@example.com", password: "secret", phone: "555" },
      headers: { origin: "http://localhost:5173" },
    };
    const res = createRes();
    const next = jest.fn();
    authService.register.mockResolvedValue({ user: { id: 1 } });

    await authController.register(req, res, next);

    expect(authService.register).toHaveBeenCalledWith({
      nombre: "Ada",
      correo: "ada@example.com",
      password: "secret",
      celular: "555",
      rol: "customer",
    }, {
      baseUrl: "http://localhost:5173",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: { id: 1 } });
    expect(next).not.toHaveBeenCalled();
  });

  it("logs in via authController", async () => {
    const req = { body: { correo: "ada@example.com", pass: "secret" }, headers: { origin: "http://localhost:5173" } };
    const res = createRes();
    const next = jest.fn();
    authService.login.mockResolvedValue({ token: "abc" });

    await authController.login(req, res, next);

    expect(authService.login).toHaveBeenCalledWith({
      correo: "ada@example.com",
      password: "secret",
    }, {
      baseUrl: "http://localhost:5173",
    });
    expect(res.json).toHaveBeenCalledWith({ token: "abc" });
  });

  it("lists stores via storeController", () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();
    storeService.listStores.mockReturnValue([{ id: 1 }]);

    storeController.listStores(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ stores: [{ id: 1 }] });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns user profile via userController.getMe", () => {
    const req = { user: { id: "u1" } };
    const res = createRes();
    const next = jest.fn();
    userService.getProfile.mockReturnValue({ id: "u1", name: "User" });

    userController.getMe(req, res, next);

    expect(userService.getProfile).toHaveBeenCalledWith("u1");
    expect(res.json).toHaveBeenCalledWith({ user: { id: "u1", name: "User" } });
  });

  it("updates profile via userController.updateMe", () => {
    const req = { user: { id: "u1" }, body: { name: "New", phone: "123" } };
    const res = createRes();
    const next = jest.fn();
    userService.updateProfile.mockReturnValue({ id: "u1", nombre: "New" });

    userController.updateMe(req, res, next);

    expect(userService.updateProfile).toHaveBeenCalledWith("u1", {
      nombre: "New",
      celular: "123",
      foto: undefined,
      rol: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({ user: { id: "u1", nombre: "New" } });
  });

  it("manages cards via userController", () => {
    const req = { user: { id: "u1" }, body: { numero: "1234", expiration: "10/30", cvv: "123", title: "Banco" }, params: { cardId: "card-1" } };
    const res = createRes();
    const next = jest.fn();
    userService.listCards.mockReturnValue([{ id: "card-1" }]);
    userService.addCard.mockReturnValue({ id: "card-99" });

    userController.listCards(req, res, next);
    expect(res.json).toHaveBeenLastCalledWith({ cards: [{ id: "card-1" }] });

    userController.addCard(req, res, next);
    expect(userService.addCard).toHaveBeenCalledWith("u1", expect.objectContaining({ numeroTarjeta: "1234" }));
    expect(res.status).toHaveBeenCalledWith(201);

    userController.removeCard(req, res, next);
    expect(userService.removeCard).toHaveBeenCalledWith("u1", "card-1");
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("Middlewares", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authMiddleware attaches user from token", () => {
    const req = { headers: { authorization: "Bearer token" } };
    const res = createRes();
    const next = jest.fn();
    authService.verifyToken.mockReturnValue({ id: "u1" });
    authService.getUserById.mockReturnValue({ id: "u1", rol: "admin" });

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: "u1", rol: "admin" });
    expect(next).toHaveBeenCalled();
  });

  it("authMiddleware forwards error when user not found", () => {
    const req = { headers: { authorization: "Bearer token" } };
    const next = jest.fn();
    authService.verifyToken.mockReturnValue({ id: "u1" });
    authService.getUserById.mockReturnValue(null);

    authMiddleware(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
  });

  it("requireAuth validates JWT tokens", () => {
    const req = { headers: { authorization: "Bearer token" } };
    const res = createRes();
    const next = jest.fn();
    jwt.verify.mockReturnValue({ id: "u1", rol: "courier" });

    requireAuth(req, res, next);

    expect(req.userId).toBe("u1");
    expect(req.userRole).toBe("courier");
    expect(next).toHaveBeenCalled();
  });

  it("requireAuth responds 401 when missing token", () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token" });
  });

  it("requireAdmin allows admin role and rejects others", () => {
    const req = { headers: { authorization: "Bearer token" } };
    const next = jest.fn();
    const resSuccess = createRes();
    authService.verifyToken.mockReturnValue({ id: "u1", rol: "admin" });

    requireAdmin(req, resSuccess, next);
    expect(next).toHaveBeenCalled();

    const resDenied = createRes();
    authService.verifyToken.mockReturnValue({ id: "u1", rol: "customer" });
    requireAdmin(req, resDenied, jest.fn());
    expect(resDenied.status).toHaveBeenCalledWith(403);
  });

  it("roleMiddleware enforces allowed roles", () => {
    const middleware = roleMiddleware(["admin", "manager"]);
    const next = jest.fn();
    const req = { user: { rol: "admin" } };
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);

    const reqDenied = { user: { rol: "customer" } };
    middleware(reqDenied, {}, next);
    const err = next.mock.calls[1][0];
    expect(err.status).toBe(403);
  });

  it("errorMiddleware serializes errors", () => {
    const error = new Error("boom");
    error.status = 418;
    const res = createRes();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    errorMiddleware(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ error: "boom" });
    consoleSpy.mockRestore();
  });
});
