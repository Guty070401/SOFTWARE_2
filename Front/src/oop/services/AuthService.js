// Servicio del registro y autenticación de usuarios contra el backend real
import ApiClient from "./ApiClient.js";
import User from "../models/User.js";

export default class AuthService {
  constructor() {
    this.api = new ApiClient();
  }

  get token() {
    return this.api.token;
  }

  async login(email, password) {
    const response = await this.api.post("/auth/login", {
      email,
      correo: email,
      password
    });

    if (response?.token) {
      this.api.setToken(response.token);
    }

    return User.fromApi(response?.user) ?? null;
  }

  async register({ name, email, password, phone }) {
    const response = await this.api.post("/auth/register", {
      nombre: name,
      correo: email,
      password,
      celular: phone
    });

    if (response?.token) {
      this.api.setToken(response.token);
    }

    return User.fromApi(response?.user) ?? null;
  }

  async getProfile() {
    const response = await this.api.get("/users/me");
    return User.fromApi(response?.user) ?? null;
  }

  async updateProfile(patch) {
    const response = await this.api.patch("/users/me", patch);
    return User.fromApi(response?.user) ?? null;
  }

  logout() {
    this.api.clearToken();
  }
}

