// Front/src/services/authService.js
import { api, setToken, clearToken } from './api';

export async function register({ nombre, correo, password, celular, rol = 'customer' }) {
  const { user, token } = await api.post('/api/auth/register', {
    nombre,
    correo,
    password,
    celular,
    rol,
  });
  setToken(token);
  return user;
}

export async function login({ correo, password }) {
  const { user, token } = await api.post('/api/auth/login', { correo, password });
  setToken(token);
  return user;
}

export function logout() {
  clearToken();
}

export function me() {
  return api.get('/api/auth/me');
}

// 🔹 Cambiar contraseña del usuario logueado
export async function changePassword({ oldPassword, newPassword }) {
  return api.post('/api/auth/change-password', {
    oldPassword,
    newPassword,
  });
}
