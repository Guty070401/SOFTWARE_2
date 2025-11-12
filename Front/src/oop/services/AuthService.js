// Servicio de auth OOP conectado al backend real
import { login as backendLogin, register as backendRegister, logout as backendLogout } from '../../services/authService';
import User from '../models/User.js';

export default class AuthService {
  async login(email, pass){
    const u = await backendLogin({ correo: email, password: pass });
    return new User(u.id, u.nombre || u.nombre_usuario || '', u.rol || null, u.correo || email);
  }
  async register({ name, email, password, celular, rol='customer' }){
    const u = await backendRegister({ nombre: name, correo: email, password, celular, rol });
    return new User(u.id, u.nombre || u.nombre_usuario || '', u.rol || 'customer', u.correo || email);
  }
  logout(){ backendLogout(); }
}
