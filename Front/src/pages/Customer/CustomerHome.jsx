import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";
import Item from "../../oop/models/Item";
import { EVENTS } from "../../oop/state/events";
import StoreService from "../../oop/services/StoreService.js";

import imgBembosLogo from '../../assets/images/bembos-logo.png';
import imgBembosNuggets from '../../assets/images/nuggets.jpg';
import imgBembosExtrema from '../../assets/images/hamburguesa-extrema.jpg';

import imgNeveraLogo from '../../assets/images/neverafit-logo.jpg';
import imgNeveraAcai from '../../assets/images/bowl-acai.jpg';
import imgNeveraTostadas from '../../assets/images/pan-palta.jpg';

import imgSushiLogo from '../../assets/images/sushi-logo.jpg';
import imgSushiAcevichado from '../../assets/images/makis-acevichado.jpg';
import imgSushiPoke from '../../assets/images/poke-atun.jpg';

const STORE_IMAGE_PLACEHOLDER = "https://via.placeholder.com/160x160?text=Tienda";
const PRODUCT_IMAGE_PLACEHOLDER = "https://via.placeholder.com/640x400?text=Producto";

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
  addItem(item) {
    const meta = { storeId: this.id, storeName: this.name };
    const base = item instanceof Item
      ? item
      : new Item(item.id, item.name, item.price, item.desc, item.image, item.qty ?? 1);
    const price = Number(base.price);
    this.items.push(new Item(
      base.id,
      base.name,
      Number.isFinite(price) ? price : 0,
      base.desc,
      base.image,
      base.qty ?? 1,
      meta
    ));
  }
}

function normaliseProductForStore(rawItem, store){
  if (!rawItem) return null;
  const priceValue = Number(rawItem.price ?? rawItem.precio ?? 0);
  return {
    id: rawItem.id,
    name: rawItem.name || rawItem.nombre || '',
    price: Number.isFinite(priceValue) ? priceValue : 0,
    desc: rawItem.desc || rawItem.descripcion || '',
    image: rawItem.image || rawItem.foto || PRODUCT_IMAGE_PLACEHOLDER,
    storeId: rawItem.storeId ?? store.id,
    storeName: rawItem.storeName || store.name
  };
}

function normaliseStoreData(rawStore){
  if (!rawStore) return null;
  const id = rawStore.id;
  const name = rawStore.name || rawStore.nombre || rawStore.nombreOrigen || 'Tienda';
  const desc = rawStore.desc || rawStore.descripcion || '';
  const image = rawStore.image || rawStore.logo || STORE_IMAGE_PLACEHOLDER;
  const rawItems = Array.isArray(rawStore.items)
    ? rawStore.items
    : Array.isArray(rawStore.productos)
      ? rawStore.productos
      : [];
  const items = rawItems
    .map((item) => normaliseProductForStore(item, { id, name }))
    .filter(Boolean);

  return {
    id,
    name,
    desc,
    image,
    items
  };
}

function isCustomStore(store){
  return typeof store?.id === 'string' && store.id.startsWith('s_');
}

// Catálogo “de fábrica”
const storeBembos = new Store("s1", "Bembos", "Las hamburguesas más bravas", imgBembosLogo);
storeBembos.addItem(new Item("p1", "Nuggets", 18, "¡Prueba nuestros deliciosos Nuggets de pollo!", imgBembosNuggets));
storeBembos.addItem(new Item("p2", "Hamburguesa Extrema", 20.90, "Doble carne, queso Edam, tocino, tomate, lechuga y mayonesa.", imgBembosExtrema));

const storeLaNevera = new Store("s2", "La Nevera Fit", "Tus desayunos siempre ganan", imgNeveraLogo);
storeLaNevera.addItem(new Item("p3", "Açai Bowl", 25, "Con granola, plátano, fresas y arándanos.", imgNeveraAcai));
storeLaNevera.addItem(new Item("p4", "Tostadas con Palta", 15, "Dos tostadas de pan integral con palta y semillas.", imgNeveraTostadas));

const storeMrSushi = new Store("s3", "Mr. Sushi", "Cada maki es un bocado de pura felicidad", imgSushiLogo);
storeMrSushi.addItem(new Item("p5", "Acevichado Maki", 28, "Roll de langostino empanizado y palta, cubierto con láminas de pescado blanco.", imgSushiAcevichado));
storeMrSushi.addItem(new Item("p6", "Poke Atún Fresco", 29.90, "Base de arroz sushi, salsa de ostión, col morada, zanahoria y cubos de Atún.", imgSushiPoke));

const DEFAULT_STORES = [storeBembos, storeLaNevera, storeMrSushi]
  .map((store) => normaliseStoreData(store))
  .filter(Boolean);
const LS_KEY = "catalog_stores";

function loadStoredStores(){
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((store) => normaliseStoreData(store)).filter(Boolean);
  } catch (error) {
    console.warn('No se pudo leer el catálogo almacenado:', error);
    return null;
  }
}

export default class CustomerHome extends React.Component {
  constructor(props){
    super(props);
    this.storeService = new StoreService();
  }

  state = {
    cartCount: 0,
    selectedStoreId: null,   // abrir/cerrar productos de una tienda
    filterStoreId: "all",    // filtro por establecimiento
    stores: [],              // catálogo editable (persistido en localStorage)
    loadingStores: false,
    error: null
  };

  componentDidMount() {
    this._mounted = true;
    // Suscripción al carrito
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });
    this.setState({ cartCount: appState.cart.length });

    // Cargar catálogo: localStorage > default
    const saved = loadStoredStores();
    if (saved && saved.length) {
      this.setState({ stores: saved });
    } else {
      this.setState({ stores: DEFAULT_STORES });
    }

    this.loadStoresFromApi();
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
    this._mounted = false;
  }

  // Guardar catálogo y refrescar UI
  saveStores = (stores, { persist = true } = {}) => {
    if (persist && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(stores));
      } catch (error) {
        console.warn('No se pudo guardar el catálogo en localStorage:', error);
      }
    }
    this.setState({ stores, error: null });
  };

  loadStoresFromApi = async () => {
    if (!this._mounted) return;
    this.setState({ loadingStores: true, error: null });
    try {
      const stores = await this.storeService.listStores();
      if (Array.isArray(stores) && stores.length) {
        const normalised = stores
          .map((store) => normaliseStoreData(store))
          .filter(Boolean);
        const currentStores = Array.isArray(this.state.stores) ? this.state.stores : [];
        const localOnlyStores = currentStores.filter((store) => isCustomStore(store)
          && !normalised.some((apiStore) => String(apiStore.id) === String(store.id)));
        const merged = [...normalised, ...localOnlyStores];
        if (this._mounted) {
          this.saveStores(merged);
        }
      }
    } catch (error) {
      if (this._mounted) {
        this.setState({ error: error?.message || 'No se pudieron cargar las tiendas.' });
      }
    } finally {
      if (this._mounted) {
        this.setState({ loadingStores: false });
      }
    }
  };

  // Añadir al carrito
  addToCart = (store, item) => {
    const storeId = item.storeId ?? store.id;
    const storeName = item.storeName ?? store.name;
    const itemForCart = new Item(
      item.id,
      item.name,
      Number(item.price),
      item.desc,
      item.image,
      1,
      { storeId, storeName }
    );
    try {
      appState.addToCart(itemForCart);
    } catch (error) {
      if (error?.code === 'CART_STORE_MISMATCH') {
        alert(error.message);
      } else {
        console.error('No se pudo agregar el producto al carrito:', error);
        alert('No se pudo agregar el producto al carrito.');
      }
    }
  };

  // Abrir/cerrar productos de una tienda
  handleToggleStore = (storeId) => {
    const idStr = String(storeId);
    this.setState(prev => ({
      selectedStoreId: prev.selectedStoreId === idStr ? null : idStr
    }));
  };

  // -------------------------
  // CRUD de productos (Front)
  // -------------------------
  addProductToStore = (storeId) => {
    const name = prompt("Nombre del producto:");
    if (!name) return;

    const priceStr = prompt("Precio (por ejemplo, 25.90):", "0");
    const price = Number(priceStr);
    if (Number.isNaN(price)) return alert("Precio inválido.");

    const desc = prompt("Descripción corta:", "") || "";
    const imageInput = prompt("URL de imagen (opcional). Si está vacío, se usará un placeholder:", "") || "";
    const image = imageInput.trim() || PRODUCT_IMAGE_PLACEHOLDER;

    const storeIdStr = String(storeId);
    const store = this.state.stores.find((s) => String(s.id) === storeIdStr) || DEFAULT_STORES.find((s) => String(s.id) === storeIdStr) || { name: "" };
    const normalizedPrice = Number(price.toFixed(2));

    const newItem = {
      id: `p_${Date.now()}`, // id local simple
      name,
      price: normalizedPrice,
      desc,
      image,
      storeId,
      storeName: store.name
    };

    const next = this.state.stores.map(s => {
      if (String(s.id) === storeIdStr) {
        const items = Array.isArray(s.items) ? [...s.items, newItem] : [newItem];
        return { ...s, items };
      }
      return s;
    });

    this.saveStores(next);
    if (this.state.selectedStoreId !== storeIdStr) {
      this.setState({ selectedStoreId: storeIdStr });
    }
  };

  removeProductFromStore = (storeId, itemId) => {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;

    const storeIdStr = String(storeId);

    const next = this.state.stores.map(s => {
      if (String(s.id) === storeIdStr) {
        const items = (s.items || []).filter(it => String(it.id) !== String(itemId));
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
    if (!appState.user) {
      alert('Debes iniciar sesión para agregar tiendas.');
      return;
    }

    const nameInput = prompt("Nombre de la tienda:");
    if (!nameInput) return;

    const name = nameInput.trim();
    if (!name) return;

    const descInput = prompt("Descripción corta:", "") || "";
    const desc = descInput.trim();
    const imageInput = prompt("URL de logo/imagen (opcional):", "") || "";
    const image = imageInput.trim() || STORE_IMAGE_PLACEHOLDER;

    this.setState({ loadingStores: true, error: null });
    try {
      const created = await this.storeService.createStore({
        name,
        desc,
        descripcion: desc,
        image,
        logo: image
      });
      const normalised = normaliseStoreData(created) || {
        id: created?.id || `s_${Date.now()}`,
        name,
        desc,
        image,
        items: []
      };
      const next = [...this.state.stores, normalised];
      this.saveStores(next);
      this.setState({ selectedStoreId: normalised.id, filterStoreId: "all" });
    } catch (error) {
      console.error('No se pudo crear la tienda en el backend:', error);
      const message = error?.message || 'No se pudo crear la tienda.';
      this.setState({ error: message });
      alert(message);
    } finally {
      this.setState({ loadingStores: false });
    }
  };

  removeStore = (storeId) => {
    if (!confirm("¿Eliminar esta tienda y todos sus productos?")) return;

    const storeIdStr = String(storeId);
    const next = this.state.stores.filter((s) => String(s.id) !== storeIdStr);
    this.saveStores(next);

    const patch = {};
    if (this.state.selectedStoreId === storeIdStr) patch.selectedStoreId = null;
    if (this.state.filterStoreId === storeIdStr) patch.filterStoreId = "all";
    if (Object.keys(patch).length) this.setState(patch);
  };

  // Restablecer catálogo de fábrica
  resetCatalog = () => {
    if (!confirm("¿Restablecer catálogo a los valores originales?")) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch (error) {
        console.warn('No se pudo limpiar el catálogo almacenado:', error);
      }
    }
    this.saveStores(DEFAULT_STORES);
    this.setState({ selectedStoreId: null, filterStoreId: "all" });
  };

  render() {
    const baseStores = this.state.stores.length ? this.state.stores : DEFAULT_STORES;
    const filterId = this.state.filterStoreId;

    // Filtro por establecimiento
    const storesToRender = filterId === "all"
      ? baseStores
      : baseStores.filter(s => String(s.id) === String(filterId));

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
  <button className="pill" onClick={this.resetCatalog} title="Restablecer catálogo">
    Reset catálogo
  </button>
  <Link to="/customer/cart" className="pill">
    Carrito ({this.state.cartCount})
  </Link>
  <Link to="/customer/orders" className="pill">
    Ver pedidos
  </Link>
</div>
        </div>

        {this.state.loadingStores && (
          <div className="mb-4 text-sm text-slate-500">
            Cargando tiendas desde el servidor...
          </div>
        )}

        {this.state.error && (
          <div className="mb-4 p-3 rounded bg-rose-100 text-rose-700 text-sm">
            {this.state.error}
          </div>
        )}

        {/* Filtro por establecimiento */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Establecimiento:</label>
          <select
            className="border rounded px-2 py-1"
            value={this.state.filterStoreId}
            onChange={(e) => this.setState({ filterStoreId: e.target.value, selectedStoreId: null })}
          >
            <option value="all">Todos</option>
            {baseStores.map(s => {
              const optionId = String(s.id);
              return (
                <option key={optionId} value={optionId}>{s.name}</option>
              );
            })}
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
          {storesToRender.map(store => {
            const storeKey = String(store.id);
            return (
              <div key={storeKey} className="card">
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
                    {this.state.selectedStoreId === storeKey ? "Cerrar" : "Ver Productos"}
                  </button>
                </div>
              </div>

              {/* Productos */}
              {this.state.selectedStoreId === storeKey && (
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
                              <button className="btn btn-secondary" onClick={() => this.addToCart(store, it)}>
                                Agregar
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => this.removeProductFromStore(store.id, it.id)}
                                title="Eliminar del catálogo"
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
          );
          })}
        </div>
      </section>
    );
  }
}

