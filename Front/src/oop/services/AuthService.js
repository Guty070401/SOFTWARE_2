// Servicio del registro y login de usuarios conectado al backend real
import ApiClient from "./ApiClient.js";
import User from "../models/User.js";

const USER_STORAGE_KEY = "ufood_user";

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (_error) {
    // Ignoramos errores (SSR o modo incógnito)
  }
  return null;
}

export default class AuthService {
  constructor() {
    this.api = new ApiClient();
    this.storage = getStorage();
  }

  mapUser(data) {
    if (!data) return null;
    return new User(data);
  }

  saveSession(token, userData) {
    if (token) {
      this.api.setToken(token);
    }
    if (this.storage) {
      if (userData) {
        this.storage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        this.storage.removeItem(USER_STORAGE_KEY);
      }
    }
  }

  restoreSession() {
    const token = this.api.token;
    const raw = this.storage ? this.storage.getItem(USER_STORAGE_KEY) : null;
    let user = null;

    if (raw) {
      try {
        const data = JSON.parse(raw);
        user = this.mapUser(data);
      } catch (_error) {
        if (this.storage) {
          this.storage.removeItem(USER_STORAGE_KEY);
        }
      }
    }

    if (!token) {
      if (this.storage) {
        this.storage.removeItem(USER_STORAGE_KEY);
      }
      return null;
    }

    return { token, user };
  }

  logout() {
    this.api.clearToken();
    if (this.storage) {
      this.storage.removeItem(USER_STORAGE_KEY);
    }
  }

  async login(email, password) {
    const data = await this.api.post("/auth/login", {
      email,
      correo: email,
      password,
    });

    const { token, user: userDto } = data || {};
    if (!token || !userDto) {
      throw new Error("Respuesta inválida del servidor");
    }

    this.saveSession(token, userDto);
    return { token, user: this.mapUser(userDto) };
  }

  async register({ name, email, password, phone }) {
    const data = await this.api.post("/auth/register", {
      nombre: name,
      name,
      correo: email,
      email,
      password,
      celular: phone,
    });

    const { token, user: userDto } = data || {};
    if (!token || !userDto) {
      throw new Error("Respuesta inválida del servidor");
    }

    this.saveSession(token, userDto);
    return { token, user: this.mapUser(userDto) };
  }

  async fetchProfile() {
    const data = await this.api.get("/users/me");
    if (!data || !data.user) {
      throw new Error("No se pudo obtener el perfil del usuario");
    }
    this.saveSession(this.api.token, data.user);
    return this.mapUser(data.user);
  }

  async updateProfile(patch) {
    const data = await this.api.patch("/users/me", patch);
    if (!data || !data.user) {
      throw new Error("No se pudo actualizar el perfil");
    }
    this.saveSession(this.api.token, data.user);
    return this.mapUser(data.user);
  }
}
