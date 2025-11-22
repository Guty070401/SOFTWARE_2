// Front/src/services/catalog.js
import { api } from "../services/api";

/**
 * Sincroniza catálogo trayendo información actualizada del backend.
 * NO ENVÍA catálogo desde el front.
 */
export async function syncCatalog() {
  // tu endpoint del backend debe devolver las tiendas actuales
  return api.get("/api/catalog/refresh");
}
