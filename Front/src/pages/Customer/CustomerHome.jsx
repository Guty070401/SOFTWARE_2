import React from "react";
import { Link } from "react-router-dom";

import ApiClient from "../../oop/services/ApiClient.js";
import appState from "../../oop/state/AppState.js";
import Item from "../../oop/models/Item.js";
import { EVENTS } from "../../oop/state/events.js";

import imgBembosLogo from "../../assets/images/bembos-logo.png";
import imgBembosNuggets from "../../assets/images/nuggets.jpg";
import imgBembosExtrema from "../../assets/images/hamburguesa-extrema.jpg";

import imgNeveraLogo from "../../assets/images/neverafit-logo.jpg";
import imgNeveraAcai from "../../assets/images/bowl-acai.jpg";
import imgNeveraTostadas from "../../assets/images/pan-palta.jpg";

import imgSushiLogo from "../../assets/images/sushi-logo.jpg";
import imgSushiAcevichado from "../../assets/images/makis-acevichado.jpg";
import imgSushiPoke from "../../assets/images/poke-atun.jpg";

const LS_KEY = "catalog_stores";

function cloneStores(stores){
  return stores.map((store) => ({
    ...store,
    items: (store.items || []).map((item) => ({ ...item }))
  }));
}

const DEFAULT_STORES = cloneStores([
  {
    id: "s1",
    name: "Bembos",
    desc: "Las hamburguesas más bravas",
    image: imgBembosLogo,
    items: [
      { id: "p1", name: "Nuggets", price: 18, desc: "¡Prueba nuestros deliciosos Nuggets de pollo!", image: imgBembosNuggets },
      { id: "p2", name: "Hamburguesa Extrema", price: 20.9, desc: "Doble carne, queso Edam, tocino, tomate, lechuga y mayonesa.", image: imgBembosExtrema }
    ]
  },
  {
    id: "s2",
    name: "La Nevera Fit",
    desc: "Tus desayunos siempre ganan",
    image: imgNeveraLogo,
    items: [
      { id: "p3", name: "Açai Bowl", price: 25, desc: "Con granola, plátano, fresas y arándanos.", image: imgNeveraAcai },
      { id: "p4", name: "Tostadas con Palta", price: 15, desc: "Dos tostadas de pan integral con palta y semillas.", image: imgNeveraTostadas }
    ]
  },
  {
    id: "s3",
    name: "Mr. Sushi",
    desc: "Cada maki es un bocado de pura felicidad",
    image: imgSushiLogo,
    items: [
      { id: "p5", name: "Acevichado Maki", price: 28, desc: "Roll de langostino empanizado y palta, cubierto con láminas de pescado blanco.", image: imgSushiAcevichado },
      { id: "p6", name: "Poke Atún Fresco", price: 29.9, desc: "Base de arroz sushi, salsa de ostión, col morada, zanahoria y cubos de atún.", image: imgSushiPoke }
    ]
  }
]);

function attachStoreMetadata(store){
  return {
    ...store,
    items: (store.items || []).map((item) => ({
      ...item,
      storeId: store.id,
      storeName: store.name
    }))
  };
}

function mapApiStore(store){
  if (!store) return null;
  const normalised = {
    id: store.id,
    name: store.nombre || store.name || "Tienda",
    desc: store.descripcion || store.description || "",
    image: store.logo || store.image || "https://via.placeholder.com/160x160?text=Tienda",
    items: Array.isArray(store.productos)
      ? store.productos.map((product) => ({
          id: product.id,
          name: product.nombre || product.name,
          price: Number(product.precio ?? product.price ?? 0),
          desc: product.descripcion || product.description || "",
          image: product.foto || product.image || "https://via.placeholder.com/640x400?text=Producto"
        }))
      : []
  };
  return attachStoreMetadata(normalised);
}

class CustomerHome extends React.Component {
  state = {
    cartCount: 0,
    selectedStoreId: null,
    filterStoreId: "all",
    stores: [],
    loadingStores: false,
    error: null
  };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });
    this.setState({ cartCount: appState.cart.length });

    const savedStores = this.loadStoredStores();
    if (savedStores.length) {
      this.setState({ stores: savedStores });
    } else {
      this.setState({ stores: DEFAULT_STORES.map(attachStoreMetadata) });
    }

    this.fetchStoresFromApi();
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  loadStoredStores() {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(attachStoreMetadata);
      }
    } catch {
      // ignore malformed data
    }
    return [];
  }

  saveStores = (stores) => {
    const payload = cloneStores(stores);
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    this.setState({ stores: payload.map(attachStoreMetadata) });
  };

  fetchStoresFromApi = async () => {
    this.setState({ loadingStores: true });
    try {
      const client = new ApiClient();
      const result = await client.get("/stores", { auth: false });
      const stores = Array.isArray(result.stores)
        ? result.stores.map(mapApiStore).filter(Boolean)
        : [];
      if (stores.length) {
        this.saveStores(stores);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se pudieron cargar las tiendas", error);
      this.setState({ error: "No se pudieron cargar las tiendas desde el servidor." });
    } finally {
      this.setState({ loadingStores: false });
    }
  };

  addToCart = (store, item) => {
    const itemForCart = new Item(
      item.id,
      item.name,
      item.price,
      item.desc,
      item.image,
      1,
      store.id,
      store.name
    );
    appState.addToCart(itemForCart);
  };

  handleToggleStore = (storeId) => {
    this.setState((prev) => ({
      selectedStoreId: prev.selectedStoreId === storeId ? null : storeId
    }));
  };

  addProductToStore = (storeId) => {
    const name = prompt("Nombre del producto:");
    if (!name) return;

    const priceStr = prompt("Precio (por ejemplo, 25.90):", "0");
    const price = Number(priceStr);
    if (Number.isNaN(price)) {
      alert("Precio inválido.");
      return;
    }

    const desc = prompt("Descripción corta:", "") || "";
    const image =
      prompt("URL de imagen (opcional). Si está vacío, se usará un placeholder:", "") ||
      "https://via.placeholder.com/640x400?text=Producto";

    const newItem = {
      id: `p_${Date.now()}`,
      name,
      price,
      desc,
      image
    };

    const next = this.state.stores.map((store) => {
      if (store.id === storeId) {
        const items = Array.isArray(store.items) ? [...store.items, { ...newItem, storeId, storeName: store.name }] : [
          { ...newItem, storeId, storeName: store.name }
        ];
        return { ...store, items };
      }
      return store;
    });

    this.saveStores(next);
    if (this.state.selectedStoreId !== storeId) {
      this.setState({ selectedStoreId: storeId });
    }
  };

  removeProductFromStore = (storeId, itemId) => {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;

    const next = this.state.stores.map((store) => {
      if (store.id === storeId) {
        const items = (store.items || []).filter((item) => item.id !== itemId);
        return { ...store, items };
      }
      return store;
    });

    this.saveStores(next);
  };

  addStore = () => {
    const name = prompt("Nombre de la tienda:");
    if (!name) return;

    const desc = prompt("Descripción corta:", "") || "";
    const image =
      prompt("URL de logo/imagen (opcional):", "") ||
      "https://via.placeholder.com/160x160?text=Tienda";

    const id = `s_${Date.now()}`;
    const newStore = attachStoreMetadata({ id, name, desc, image, items: [] });

    const next = [...this.state.stores, newStore];
    this.saveStores(next);
    this.setState({ selectedStoreId: id, filterStoreId: "all" });
  };

  removeStore = (storeId) => {
    if (!confirm("¿Eliminar esta tienda y todos sus productos?")) return;

    const next = this.state.stores.filter((store) => store.id !== storeId);
    this.saveStores(next);

    const patch = {};
    if (this.state.selectedStoreId === storeId) patch.selectedStoreId = null;
    if (this.state.filterStoreId === storeId) patch.filterStoreId = "all";
    if (Object.keys(patch).length) this.setState(patch);
  };

  resetCatalog = () => {
    if (!confirm("¿Restablecer catálogo a los valores originales?")) return;
    localStorage.removeItem(LS_KEY);
    const stores = DEFAULT_STORES.map(attachStoreMetadata);
    this.setState({ stores, selectedStoreId: null, filterStoreId: "all" });
  };

  render() {
    const baseStores = this.state.stores.length ? this.state.stores : DEFAULT_STORES.map(attachStoreMetadata);
    const storesToRender = this.state.filterStoreId === "all"
      ? baseStores
      : baseStores.filter((store) => store.id === this.state.filterStoreId);

    return (
      <section>
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

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Establecimiento:</label>
          <select
            className="border rounded px-2 py-1"
            value={this.state.filterStoreId}
            onChange={(e) => this.setState({ filterStoreId: e.target.value, selectedStoreId: null })}
          >
            <option value="all">Todos</option>
            {baseStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
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

        {this.state.loadingStores && (
          <div className="card border border-indigo-200 bg-indigo-50 text-sm text-indigo-700 mb-4">
            Actualizando catálogo desde el servidor...
          </div>
        )}
        {this.state.error && (
          <div className="card border border-rose-200 bg-rose-50 text-sm text-rose-700 mb-4">
            {this.state.error}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {storesToRender.map((store) => (
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

              {this.state.selectedStoreId === store.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold mb-2">Productos de {store.name}</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(store.items || []).map((item) => (
                      <div key={item.id} className="card p-0 overflow-hidden flex flex-col">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-slate-500 line-clamp-3">{item.desc}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="font-semibold">S/ {item.price}</span>
                            <div className="flex gap-2">
                              <button className="btn btn-secondary" onClick={() => this.addToCart(store, item)}>
                                Agregar
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => this.removeProductFromStore(store.id, item.id)}
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
          ))}
        </div>
      </section>
    );
  }
}

export default CustomerHome;
