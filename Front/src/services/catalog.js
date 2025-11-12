// Front/src/services/catalog.js
import { api } from "../services/api";

// Catálogo visible en tu UI (ids estables)
export const seedCatalog = [
  {
    store: { id: "bembos", nombre: "Bembos", descripcion: "Las hamburguesas más bravas", logo: null },
    products: [
      { id: "bembos_nuggets", tienda_id: "bembos", nombre: "Nuggets", descripcion: "¡Prueba nuestros deliciosos Nuggets de pollo!", precio: 18.00, foto: null },
      { id: "bembos_burger",  tienda_id: "bembos", nombre: "Hamburguesa Extrema", descripcion: "Doble carne, queso Edam, tocino, tomate, lechuga y mayonesa.", precio: 20.90, foto: null },
    ]
  },
  {
    store: { id: "nevera_fit", nombre: "La Nevera Fit", descripcion: "Tus desayunos siempre ganan", logo: null },
    products: [
      { id: "nevera_acai",  tienda_id: "nevera_fit", nombre: "Açaí Bowl", descripcion: "Con granola, plátano, fresas y arándanos.", precio: 25.00, foto: null },
      { id: "nevera_toast", tienda_id: "nevera_fit", nombre: "Tostadas con Palta", descripcion: "Pan integral con palta y semillas.", precio: 15.00, foto: null },
    ]
  },
  {
    store: { id: "mr_sushi", nombre: "Mr. Sushi", descripcion: "Cada maki es un bocado de pura felicidad", logo: null },
    products: [
      { id: "mrsushi_acevichado", tienda_id: "mr_sushi", nombre: "Acevichado Maki", descripcion: "Langostino empanizado, palta y pescado blanco.", precio: 28.00, foto: null },
      { id: "mrsushi_poke",       tienda_id: "mr_sushi", nombre: "Poke Atún Fresco", descripcion: "Arroz sushi con cubos de atún y vegetales.", precio: 29.90, foto: null },
    ]
  }
];

export async function syncCatalog() {
  // llama a tu backend: POST /api/catalog/sync
  return api.post("/api/catalog/sync", { catalog: seedCatalog });
}
