import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";            // âœ… ruta correcta
import Item from "../../oop/models/Item";
import { EVENTS } from "../../oop/state/events";

import { syncCatalog } from "../../services/catalog";       // âœ… NEW
// import { api } from "../../services/api";                // si luego quieres leer del back
import { StoresApi } from "../../services/storeService";

import imgBembosLogo from '../../assets/images/bembos-logo.png';
import imgBembosNuggets from '../../assets/images/nuggets.jpg';
import imgBembosExtrema from '../../assets/images/hamburguesa-extrema.jpg';

import imgNeveraLogo from '../../assets/images/neverafit-logo.jpg';
import imgNeveraAcai from '../../assets/images/bowl-acai.jpg';
import imgNeveraTostadas from '../../assets/images/pan-palta.jpg';

import imgSushiLogo from '../../assets/images/sushi-logo.jpg';
import imgSushiAcevichado from '../../assets/images/makis-acevichado.jpg';
import imgSushiPoke from '../../assets/images/poke-atun.jpg';

// -------------------------
// Modelo simple de tienda
// -------------------------
class Store {
  constructor(id, name, desc, image) {
    this.id = id;
    this.name = name;
    this.desc = desc;
    this.image = image;
    this.items = [];
  }
  addItem(item) { this.items.push(item); }
}

// CatÃ¡logo â€œde fÃ¡bricaâ€
const storeBembos = new Store("s1", "Bembos", "Las hamburguesas mÃ¡s bravas", imgBembosLogo);
storeBembos.addItem(new Item("p1", "Nuggets", 18, "Â¡Prueba nuestros deliciosos Nuggets de pollo!", imgBembosNuggets));
storeBembos.addItem(new Item("p2", "Hamburguesa Extrema", 20.90, "Doble carne, queso Edam, tocino, tomate, lechuga y mayonesa.", imgBembosExtrema));

const storeLaNevera = new Store("s2", "La Nevera Fit", "Tus desayunos siempre ganan", imgNeveraLogo);
storeLaNevera.addItem(new Item("p3", "AÃ§ai Bowl", 25, "Con granola, plÃ¡tano, fresas y arÃ¡ndanos.", imgNeveraAcai));
storeLaNevera.addItem(new Item("p4", "Tostadas con Palta", 15, "Dos tostadas de pan integral con palta y semillas.", imgNeveraTostadas));

const storeMrSushi = new Store("s3", "Mr. Sushi", "Cada maki es un bocado de pura felicidad", imgSushiLogo);
storeMrSushi.addItem(new Item("p5", "Acevichado Maki", 28, "Roll de langostino empanizado y palta, cubierto con lÃ¡minas de pescado blanco.", imgSushiAcevichado));
storeMrSushi.addItem(new Item("p6", "Poke AtÃºn Fresco", 29.90, "Base de arroz sushi, salsa de ostiÃ³n, col morada, zanahoria y cubos de AtÃºn.", imgSushiPoke));

const DEFAULT_STORES = [storeBembos, storeLaNevera, storeMrSushi];
const LS_KEY = "catalog_stores";

// ====== NEW: mapeos para IDs reales en Supabase ======
const STORE_ID_MAP = {
  s1: "bembos",
  s2: "nevera_fit",
  s3: "mr_sushi",
};

const PRODUCT_ID_MAP = {
  // Bembos
  p1: "bembos_nuggets",
  p2: "bembos_burger",
  // La Nevera Fit
  p3: "nevera_acai",
  p4: "nevera_toast",
  // Mr. Sushi
  p5: "mrsushi_acevichado",
  p6: "mrsushi_poke",
};

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

export class CustomerHome extends React.Component {
  state = {
    cartCount: 0,
    selectedStoreId: null,   // abrir/cerrar productos de una tienda
    filterStoreId: "all",    // filtro por establecimiento
    stores: []               // catÃ¡logo editable (persistido en localStorage)
  };

  componentDidMount() {
    // SuscripciÃ³n al carrito
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });
    this.setState({ cartCount: appState.cart.length });

    // Cargar catÃ¡logo: localStorage > default
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.setState({ stores: parsed });
      } catch {
        this.setState({ stores: DEFAULT_STORES });
      }
    } else {
      this.setState({ stores: DEFAULT_STORES });
    }
    this.ensureCatalogSynced();
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  ensureCatalogSynced = async () => {
    if (localStorage.getItem("catalog_synced")) return;
    try {
      await syncCatalog();
      localStorage.setItem("catalog_synced", "1");
      console.log("[catalog] sincronizado automáticamente");
    } catch (error) {
      console.warn("[catalog] no se pudo sincronizar automáticamente", error);
    }
  };

  saveStores = (stores) => {
    this.setState({ stores });
    localStorage.setItem(LS_KEY, JSON.stringify(stores));
  };

  // ====== NEW: sincronizar catÃ¡logo al backend/Supabase ======
  onSyncCatalog = async () => {
    try {
      const resp = await syncCatalog();
      console.log("[sync] ok =>", resp);
      alert("CatÃ¡logo sincronizado en Supabase");
      // Si mÃ¡s adelante listamos desde el backend, aquÃ­ harÃ­amos un refetch
    } catch (e) {
      console.error(e);
      alert("Error sincronizando catÃ¡logo: " + (e?.message || ""));
    }
  };

  // AÃ±adir al carrito (usando IDs reales para que el checkout no rompa)
  addToCart = (item, store) => {
    const backendProductId = PRODUCT_ID_MAP[item.id] || item.id;   // traduce p1..p6
    const backendStoreId   = STORE_ID_MAP[store.id] || store.id;   // traduce s1..s3

    const itemForCart = {
      id: backendProductId,         // âœ… coincide con productos.id en Supabase
      name: item.name,
      price: Number(item.price),
      desc: item.desc,
      image: item.image,
      qty: 1,
      storeId: backendStoreId       // âœ… coincide con tiendas.id
    };

    appState.addToCart(itemForCart);
  };

  // Abrir/cerrar productos de una tienda
  handleToggleStore = (storeId) => {
    this.setState(prev => ({
      selectedStoreId: prev.selectedStoreId === storeId ? null : storeId
    }));
  };

  // -------------------------
  // CRUD de productos (Front)
  // -------------------------
  addProductToStore = async (storeId) => {
    const name = prompt("Nombre del producto:");
    if (!name) return;

    const priceStr = prompt("Precio (por ejemplo, 25.90):", "0");
    const price = Number(priceStr);
    if (Number.isNaN(price)) return alert("Precio invÃ¡lido.");

    const desc = prompt("DescripciÃ³n corta:", "") || "";
    const image = prompt("URL de imagen (opcional). Si estÃ¡ vacÃ­o, se usarÃ¡ un placeholder:", "") ||
      "https://via.placeholder.com/640x400?text=Producto";

    const backendStoreId = STORE_ID_MAP[storeId] || storeId;
    const newItemId = `${backendStoreId}_${slugify(name) || Date.now()}`;

    try {
      await StoresApi.createProduct(backendStoreId, {
        id: newItemId,
        nombre: name,
        descripcion: desc,
        precio: price,
        foto: image
      });
    } catch (error) {
      console.error("No se pudo guardar el producto en BD", error);
      alert("No se pudo guardar el producto en el servidor. Intenta de nuevo.");
      return;
    }

    const newItem = { id: newItemId, name, price, desc, image };

    const next = this.state.stores.map(s => {
      if (s.id === storeId) {
        const items = Array.isArray(s.items) ? [...s.items, newItem] : [newItem];
        return { ...s, items };
      }
      return s;
    });

    this.saveStores(next);
    if (this.state.selectedStoreId !== storeId) {
      this.setState({ selectedStoreId: storeId });
    }
  };

  removeProductFromStore = (storeId, itemId) => {
    if (!confirm("Â¿Eliminar este producto del catÃ¡logo?")) return;

    const next = this.state.stores.map(s => {
      if (s.id === storeId) {
        const items = (s.items || []).filter(it => it.id !== itemId);
        return { ...s, items };
      }
      return s;
    });

    this.saveStores(next);
  };

  // -------------------------
  // CRUD de tiendas (Front)
  // -------------------------
  addStore = async () => {
    const name = prompt("Nombre de la tienda:");
    if (!name) return;

    const desc = prompt("DescripciÃ³n corta:", "") || "";
    const image =
      prompt("URL de logo/imagen (opcional):", "") ||
      "https://via.placeholder.com/160x160?text=Tienda";

    const backendId = slugify(name) || `store_${Date.now()}`;

    try {
      await StoresApi.create({ id: backendId, nombre: name, logo: image });
    } catch (error) {
      console.error("No se pudo guardar la tienda en BD", error);
      alert("No se pudo guardar la tienda en el servidor. Intenta de nuevo.");
      return;
    }

    const newStore = { id: backendId, name, desc, image, items: [] };

    const next = [...this.state.stores, newStore];
    this.saveStores(next);
    // Abrimos la nueva tienda para que agregues productos
    this.setState({ selectedStoreId: backendId, filterStoreId: "all" });
  };

  removeStore = (storeId) => {
    if (!confirm("Â¿Eliminar esta tienda y todos sus productos?")) return;

    const next = this.state.stores.filter((s) => s.id !== storeId);
    this.saveStores(next);

    const patch = {};
    if (this.state.selectedStoreId === storeId) patch.selectedStoreId = null;
    if (this.state.filterStoreId === storeId) patch.filterStoreId = "all";
    if (Object.keys(patch).length) this.setState(patch);
  };

  // Restablecer catÃ¡logo de fÃ¡brica (solo local)
  resetCatalog = () => {
    if (!confirm("Â¿Restablecer catÃ¡logo a los valores originales?")) return;
    localStorage.removeItem(LS_KEY);
    this.setState({ stores: DEFAULT_STORES, selectedStoreId: null, filterStoreId: "all" });
  };

  render() {
    const baseStores = this.state.stores.length ? this.state.stores : DEFAULT_STORES;

    // Filtro por establecimiento
    const storesToRender = this.state.filterStoreId === "all"
      ? baseStores
      : baseStores.filter(s => s.id === this.state.filterStoreId);

    return (
      <section>
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Tiendas</h1>
            <p className="text-slate-500">Elige tu tienda y platos favoritos</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="pill" onClick={this.addStore}>+ Agregar tienda</button>
            <button className="pill" onClick={this.resetCatalog} title="Restablecer catÃ¡logo">
              Reset catÃ¡logo (local)
            </button>
            {/* âœ… NEW: sincroniza con Supabase vÃ­a backend */}
            <button className="pill" onClick={this.onSyncCatalog} title="Upsert en Supabase">
              Sincronizar catÃ¡logo
            </button>
            <Link to="/customer/cart" className="pill">
              Carrito ({this.state.cartCount})
            </Link>
            <Link to="/customer/orders" className="pill">
              Ver pedidos
            </Link>
          </div>
        </div>

        {/* Filtro por establecimiento */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Establecimiento:</label>
          <select
            className="border rounded px-2 py-1"
            value={this.state.filterStoreId}
            onChange={(e) => this.setState({ filterStoreId: e.target.value, selectedStoreId: null })}
          >
            <option value="all">Todos</option>
            {baseStores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {this.state.filterStoreId !== "all" && (
            <button
              className="btn"
              onClick={() => this.setState({ filterStoreId: "all", selectedStoreId: null })}
            >
              Ver todos
            </button>
          )}
        </div>

        {/* Listado de tiendas */}
        <div className="flex flex-col gap-6">
          {storesToRender.map(store => (
            <div key={store.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={store.image}
                  alt={store.name}
                  className="h-24 w-24 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold">{store.name}</h3>
                  <p className="text-slate-500">{store.desc}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn btn-outline self-center"
                    onClick={() => this.addProductToStore(store.id)}
                  >
                    + Agregar producto
                  </button>

                  <button
                    className="btn btn-danger self-center"
                    onClick={() => this.removeStore(store.id)}
                    title="Eliminar tienda"
                  >
                    Eliminar tienda
                  </button>

                  <button
                    className="btn btn-primary self-center flex-shrink-0"
                    onClick={() => this.handleToggleStore(store.id)}
                  >
                    {this.state.selectedStoreId === store.id ? "Cerrar" : "Ver Productos"}
                  </button>
                </div>
              </div>

              {/* Productos */}
              {this.state.selectedStoreId === store.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold mb-2">Productos de {store.name}</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(store.items || []).map(it => (
                      <div key={it.id} className="card p-0 overflow-hidden flex flex-col">
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold">{it.name}</h3>
                          <p className="text-sm text-slate-500 line-clamp-3">{it.desc}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="font-semibold">S/ {it.price}</span>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-secondary"
                                onClick={() => this.addToCart(it, store)}   // âœ… usa mapeo a IDs reales
                              >
                                Agregar
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => this.removeProductFromStore(store.id, it.id)}
                                title="Eliminar del catÃ¡logo"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(store.items || []).length === 0 && (
                      <div className="text-slate-500 italic">No hay productos en esta tienda.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }
}
export default CustomerHome;
