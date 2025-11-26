// Front/src/services/api.js
const envBaseUrl = import.meta?.env?.VITE_API_URL;
const BASE_URL = envBaseUrl && !/localhost|127\.0\.0\.1/i.test(envBaseUrl)
  ? envBaseUrl
  : '/api';
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
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
        ...(_token ? { Authorization: `Bearer ${_token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch (networkError) {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
  }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const defaultMsg = res.statusText || 'No se pudo completar la solicitud.';
    let message = data?.message;

    if (typeof data === 'string') {
      const trimmed = data.trim();
      const looksLikeHtml = /^<(!doctype|html|head|body|script|style)[\s>]/i.test(trimmed) || /<\w+[\s\S]*>/i.test(trimmed);
      const shortMessage = trimmed.length <= 200 && !looksLikeHtml ? trimmed : null;
      message = shortMessage || `Error ${res.status || ''}: ${defaultMsg}`.trim();
    }

    if (!message) message = `Error ${res.status || ''}: ${defaultMsg}`.trim();

    const err = new Error(message);
    err.status = res.status;
    if (data && typeof data === 'object') {
      err.data = data;
      if (data.meta) err.meta = data.meta;
    }
    throw err;
  }

  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  del: (p) => request(p, { method: 'DELETE' })
};
