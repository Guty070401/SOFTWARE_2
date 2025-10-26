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

export default class UserService {
  constructor(){
    this.api = new ApiClient();
  }

  async getProfile(){
    const result = await this.api.get("/users/me");
    return mapToUser(result.user);
  }

  async updateProfile(payload){
    const result = await this.api.put("/users/me", payload);
    return mapToUser(result.user);
  }
}
