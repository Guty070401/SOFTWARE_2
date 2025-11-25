// Front/src/services/api.js
export const BASE_URL = (import.meta?.env?.VITE_API_URL) || '/api';
console.log('[FRONT] BASE_URL =>', BASE_URL);

let _token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export function setToken(t) {
  _token = t;
  if (typeof localStorage !== 'undefined') localStorage.setItem('token', t);
}
export function clearToken() {
  _token = null;
  if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${BASE_URL}${normalizedPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(_token ? { Authorization: `Bearer ${_token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.message || 'Error'));
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  del: (p) => request(p, { method: 'DELETE' })
};
