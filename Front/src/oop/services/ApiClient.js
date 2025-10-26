const DEFAULT_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : "http://localhost:3000/api";

function normalisePath(path){
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export default class ApiClient {
  constructor(baseURL = DEFAULT_BASE_URL){
    this.baseURL = baseURL.replace(/\/$/, "");
  }

  static storageKey = "ufood_token";
  static authToken = ApiClient.loadInitialToken();

  static loadInitialToken(){
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(ApiClient.storageKey);
    } catch {
      return null;
    }
  }

  static setAuthToken(token){
    ApiClient.authToken = token || null;
    if (typeof window === "undefined") return;
    try {
      if (token) {
        window.localStorage.setItem(ApiClient.storageKey, token);
      } else {
        window.localStorage.removeItem(ApiClient.storageKey);
      }
    } catch {
      // Silently ignore storage issues
    }
  }

  static clearAuthToken(){
    ApiClient.setAuthToken(null);
  }

  static getAuthToken(){
    return ApiClient.authToken || null;
  }

  buildUrl(path){
    if (!path) return this.baseURL;
    if (/^https?:/i.test(path)) return path;
    return `${this.baseURL}${normalisePath(path)}`;
  }

  buildHeaders({ auth = true } = {}){
    const headers = {
      "Content-Type": "application/json"
    };
    if (auth !== false && ApiClient.authToken){
      headers.Authorization = `Bearer ${ApiClient.authToken}`;
    }
    return headers;
  }

  async request(path, { method = "GET", data, auth = true } = {}){
    const response = await fetch(this.buildUrl(path), {
      method,
      headers: this.buildHeaders({ auth }),
      body: data !== undefined ? JSON.stringify(data) : undefined
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok){
      const message = payload?.message || payload?.error || (typeof payload === "string" ? payload : "Error al llamar API");
      const error = new Error(message || "Error de API");
      error.status = response.status;
      error.data = payload;
      throw error;
    }

    return payload;
  }

  get(path, options){
    return this.request(path, { ...options, method: "GET" });
  }

  post(path, data, options){
    return this.request(path, { ...options, method: "POST", data });
  }

  put(path, data, options){
    return this.request(path, { ...options, method: "PUT", data });
  }

  patch(path, data, options){
    return this.request(path, { ...options, method: "PATCH", data });
  }

  delete(path, options){
    return this.request(path, { ...options, method: "DELETE" });
  }
}
