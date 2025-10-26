import ApiClient from "./ApiClient.js";
import User from "../models/User.js";

function mapToUser(payload){
  if (!payload) return null;
  return new User(
    payload.id,
    payload.nombre || payload.name || payload.nombreUsuario || "",
    payload.rol || payload.role || null,
    payload.correo || payload.email || "",
    payload.celular || payload.phone || "",
    payload.foto || payload.photo || null
  );
}

export default class AuthService {
  constructor(){
    this.api = new ApiClient();
  }

  async login(email, password){
    const result = await this.api.post("/auth/login", { email, password }, { auth: false });
    ApiClient.setAuthToken(result.token);
    return { user: mapToUser(result.user), token: result.token };
  }

  async register({ name, email, password, phone }){
    const payload = {
      nombre: name,
      correo: email,
      password,
      celular: phone
    };
    const result = await this.api.post("/auth/register", payload, { auth: false });
    ApiClient.setAuthToken(result.token);
    return { user: mapToUser(result.user), token: result.token };
  }

  logout(){
    ApiClient.clearAuthToken();
  }
}
