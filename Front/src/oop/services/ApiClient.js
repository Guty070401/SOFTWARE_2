const TOKEN_STORAGE_KEY = "ufood_token";

function normaliseBaseUrl(input) {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const ensurePath = (path) => {
    const withoutTrailingSlash = path.replace(/\/+$/, "");
    if (!withoutTrailingSlash || withoutTrailingSlash === "/") {
      return "/api";
    }
    return withoutTrailingSlash.startsWith("/") ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
  };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      url.pathname = ensurePath(url.pathname || "/");
      return url.toString().replace(/\/$/, "");
    } catch {
      return null;
    }
  }

  const path = ensurePath(trimmed);
  return path;
}

function resolveBaseUrl() {
  if (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL) {
    const explicit = normaliseBaseUrl(import.meta.env.VITE_API_URL);
    if (explicit) {
      return explicit;
    }
  }

  if (typeof window !== "undefined") {
    if (window.__API_URL__) {
      const injected = normaliseBaseUrl(window.__API_URL__);
      if (injected) {
        return injected;
      }
    }
    if (window.location) {
      return "/api";
    }
  }

  const globalProcess = typeof globalThis !== "undefined" ? globalThis.process : undefined;
  if (globalProcess?.env?.VITE_API_URL) {
    const envUrl = normaliseBaseUrl(globalProcess.env.VITE_API_URL);
    if (envUrl) {
      return envUrl;
    }
  }
  if (globalProcess?.env?.API_URL) {
    const legacyUrl = normaliseBaseUrl(globalProcess.env.API_URL);
    if (legacyUrl) {
      return legacyUrl;
    }
  }

  return "http://localhost:3000/api";
}

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignoramos errores de acceso (SSR o modo incógnito)
  }
  return null;
}

const storage = getStorage();
let sharedToken = storage ? storage.getItem(TOKEN_STORAGE_KEY) : null;

function normalisePath(path = "") {
  return path.startsWith("/") ? path : `/${path}`;
}

export default class ApiClient {
  constructor(baseUrl) {
    const resolved = baseUrl || resolveBaseUrl();
    this.baseUrl = (resolved || "").replace(/\/$/, "");

    if (sharedToken === null && storage) {
      sharedToken = storage.getItem(TOKEN_STORAGE_KEY);
    }
  }

  get token() {
    return sharedToken;
  }

  setToken(token, { persist = true } = {}) {
    sharedToken = token || null;
    if (storage && persist) {
      if (sharedToken) {
        storage.setItem(TOKEN_STORAGE_KEY, sharedToken);
      } else {
        storage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }

  clearToken() {
    this.setToken(null);
  }

  async request(path, { method = "GET", body, headers = {}, signal } = {}) {
    const url = `${this.baseUrl}${normalisePath(path)}`;
    const finalHeaders = typeof Headers !== "undefined" ? new Headers(headers) : new Map(Object.entries(headers));

    const options = { method, signal };

    if (sharedToken) {
      finalHeaders.set("Authorization", `Bearer ${sharedToken}`);
    }

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;

    if (body !== undefined) {
      if (isFormData || isBlob) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body ?? {});
        if (!finalHeaders.has("Content-Type")) {
          finalHeaders.set("Content-Type", "application/json");
        }
      }
    }

    if (typeof Headers !== "undefined") {
      options.headers = finalHeaders;
    } else {
      options.headers = Object.fromEntries(finalHeaders.entries());
    }

    const response = await fetch(url, options);
    const contentType = response.headers?.get?.("content-type") || "";
    let payload = null;

    if (contentType.includes("application/json")) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    } else if (response.status !== 204) {
      try {
        payload = await response.text();
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const message = (payload && typeof payload === "object")
        ? payload.message || payload.error || payload.errors?.[0]?.message
        : (typeof payload === "string" && payload.trim().length ? payload : response.statusText);

      const error = new Error(message || "Error en la solicitud");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  get(path, options) {
    return this.request(path, { ...options, method: "GET" });
  }

  post(path, body, options) {
    return this.request(path, { ...options, method: "POST", body });
  }

  patch(path, body, options) {
    return this.request(path, { ...options, method: "PATCH", body });
  }

  delete(path, options) {
    return this.request(path, { ...options, method: "DELETE" });
  }
}
