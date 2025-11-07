const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000/api').replace(/\/$/, '');

const TOKEN_STORAGE_KEY = 'ufood_token';

function isBrowser(){
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

let authToken = null;

function readToken(){
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('No se pudo leer el token desde localStorage:', error);
    return null;
  }
}

authToken = readToken();

export function getAuthToken(){
  return authToken;
}

export function setAuthToken(token){
  authToken = token || null;
  if (!isBrowser()) return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('No se pudo persistir el token en localStorage:', error);
  }
}

export function clearAuthToken(){
  setAuthToken(null);
}

async function parseResponse(response){
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default class ApiClient {
  constructor(baseUrl = BASE_URL){
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  buildUrl(path){
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  async request(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}){
    const url = this.buildUrl(path);
    const init = {
      method,
      headers: { ...headers },
      credentials: 'include'
    };

    if (body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!init.headers['Content-Type']) {
        init.headers['Content-Type'] = 'application/json';
      }
    }

    const token = getAuthToken();
    if (!skipAuth && token) {
      init.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, init);
    const data = await parseResponse(response);

    if (!response.ok) {
      const message = typeof data === 'string'
        ? data
        : data?.message || data?.error || `Error ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  get(path, options){
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options){
    return this.request(path, { ...options, method: 'POST', body });
  }

  patch(path, body, options){
    return this.request(path, { ...options, method: 'PATCH', body });
  }

  delete(path, options){
    return this.request(path, { ...options, method: 'DELETE' });
  }
}
