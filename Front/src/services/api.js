// Front/src/services/api.js
const BASE_URL = (import.meta?.env?.VITE_API_URL) || '/api';
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
    console.error('[API] Error de red al llamar', path, networkError);

    const offlineHint = typeof navigator !== 'undefined' && navigator.onLine === false
      ? 'Parece que no tienes conexión a internet.'
      : null;

    const nativeMessage = networkError?.message && !/failed to fetch/i.test(networkError.message)
      ? networkError.message
      : null;

    const details = offlineHint || nativeMessage;
    const baseMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    throw new Error(details ? `${baseMessage} ${details}` : baseMessage);
  }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const defaultMsg = res.statusText || 'No se pudo completar la solicitud.';

    if (typeof data === 'string') {
      const trimmed = data.trim();
      const looksLikeHtml = /^<(!doctype|html|head|body|script|style)[\s>]/i.test(trimmed) || /<\w+[\s\S]*>/i.test(trimmed);
      const shortMessage = trimmed.length <= 200 && !looksLikeHtml ? trimmed : null;
      throw new Error(shortMessage || `Error ${res.status || ''}: ${defaultMsg}`.trim());
    }

    throw new Error(data?.message || `Error ${res.status || ''}: ${defaultMsg}`.trim());
  }

  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  del: (p) => request(p, { method: 'DELETE' })
};
