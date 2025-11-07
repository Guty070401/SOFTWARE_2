// Servicio del regisstro y logeo de usuarios
import ApiClient from "./ApiClient.js";
import User from "../models/User.js";

export default class AuthService {
  constructor(){ this.api = new ApiClient(); }

  async login(email, _pass){
    // Simula login
    const name = email.split("@")[0] || "Usuario";
    const user = new User(crypto.randomUUID?.() || Date.now().toString(), name, null, email);
    await this.api.post("/login", { email });
    return user;
  }

  async register({ name, email }){
    const user = new User(crypto.randomUUID?.() || Date.now().toString(), name, null, email);
    await this.api.post("/register", { name, email });
    return user;
  }
}

