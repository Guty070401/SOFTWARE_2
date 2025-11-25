import { api, setToken, clearToken } from './api';

export async function register({ nombre, correo, password, celular, rol='customer' }) {
  const { user } = await api.post('/auth/register', { nombre, correo, password, celular, rol });
  // No seteamos token: requiere verificar correo antes de login
  return user;
}
export async function login({ correo, password }) {
  const { user, token } = await api.post('/auth/login', { correo, password });
  setToken(token);
  return user;
}
export async function verifyEmailToken(token){
  const { user, token: jwt } = await api.post('/auth/verify-email', { token });
  if (jwt) setToken(jwt);
  return user;
}
export async function changePassword({ oldPassword, newPassword }) {
  return api.post('/users/me/change-password', { oldPassword, newPassword });
}
export function logout(){ clearToken(); }
export function me(){ return api.get('/auth/me'); }
