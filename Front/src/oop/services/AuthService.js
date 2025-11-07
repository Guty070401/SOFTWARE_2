// Servicio del registro y logeo de usuarios conectado al backend
import ApiClient, { clearAuthToken, setAuthToken } from './ApiClient.js';
import User from '../models/User.js';

const USER_STORAGE_KEY = 'ufood_user';

function isBrowser(){
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredUser(){
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('No se pudo leer el usuario almacenado:', error);
    return null;
  }
}

export default class AuthService {
  constructor(){
    this.api = new ApiClient();
    this.cachedUserData = readStoredUser();
  }

  mapUser(data){
    if (!data) return null;
    return new User(
      data.id,
      data.nombre || data.name || data.nombreUsuario || 'Usuario',
      data.rol || data.role || null,
      data.correo || data.email || ''
    );
  }

  persistUser(data){
    this.cachedUserData = data || null;
    if (isBrowser()) {
      try {
        if (data) {
          window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        } else {
          window.localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (error) {
        console.warn('No se pudo guardar el usuario en localStorage:', error);
      }
    }
    return this.mapUser(data);
  }

  getStoredUser(){
    return this.mapUser(this.cachedUserData);
  }

  async login(email, password){
    const payload = { email, password };
    const data = await this.api.post('/auth/login', payload, { skipAuth: true });
    setAuthToken(data?.token || null);
    return this.persistUser(data?.user || null);
  }

  async register({ name, email, password, phone }){
    const payload = {
      nombre: name,
      correo: email,
      password,
      celular: phone
    };
    const data = await this.api.post('/auth/register', payload, { skipAuth: true });
    setAuthToken(data?.token || null);
    return this.persistUser(data?.user || null);
  }

  async updateRole(role){
    const data = await this.api.patch('/users/me', { rol: role });
    return this.persistUser(data?.user || null);
  }

  logout(){
    clearAuthToken();
    this.persistUser(null);
  }
}
