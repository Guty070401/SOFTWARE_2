import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";
import Item from "../../oop/models/Item";
import { EVENTS } from "../../oop/state/events";

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

const DEFAULT_STORES = [storeBembos, storeLaNevera, storeMrSushi];
const LS_KEY = "catalog_stores";

export default class CustomerHome extends React.Component {
  state = {
    cartCount: 0,
    selectedStoreId: null,   // abrir/cerrar productos de una tienda
    filterStoreId: "all",    // filtro por establecimiento
    stores: []               // catálogo editable (persistido en localStorage)
  };

  componentDidMount() {
    // Suscripción al carrito
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });
    this.setState({ cartCount: appState.cart.length });

    // Cargar catálogo: localStorage > default
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
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  // Guardar catálogo y refrescar UI
  saveStores = (stores) => {
    localStorage.setItem(LS_KEY, JSON.stringify(stores));
    this.setState({ stores });
  };

  // Añadir al carrito
  addToCart = (item) => {
    const itemForCart = new Item(
      item.id,
      item.name,
      item.price,
      item.desc,
      item.image,
      1
    );
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
  addProductToStore = (storeId) => {
    const name = prompt("Nombre del producto:");
    if (!name) return;

    const priceStr = prompt("Precio (por ejemplo, 25.90):", "0");
    const price = Number(priceStr);
    if (Number.isNaN(price)) return alert("Precio inválido.");

    const desc = prompt("Descripción corta:", "") || "";
    const image = prompt("URL de imagen (opcional). Si está vacío, se usará un placeholder:", "") ||
      "https://via.placeholder.com/640x400?text=Producto";

    const newItem = {
      id: `p_${Date.now()}`, // id local simple
      name,
      price,
      desc,
      image
    };

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
    if (!confirm("¿Eliminar este producto del catálogo?")) return;

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
  addStore = () => {
    const name = prompt("Nombre de la tienda:");
    if (!name) return;

    const desc = prompt("Descripción corta:", "") || "";
    const image =
      prompt("URL de logo/imagen (opcional):", "") ||
      "https://via.placeholder.com/160x160?text=Tienda";

    const id = `s_${Date.now()}`;
    const newStore = { id, name, desc, image, items: [] };

    const next = [...this.state.stores, newStore];
    this.saveStores(next);
    // Abrimos la nueva tienda para que agregues productos
    this.setState({ selectedStoreId: id, filterStoreId: "all" });
  };

  removeStore = (storeId) => {
    if (!confirm("¿Eliminar esta tienda y todos sus productos?")) return;

    const next = this.state.stores.filter((s) => s.id !== storeId);
    this.saveStores(next);

    const patch = {};
    if (this.state.selectedStoreId === storeId) patch.selectedStoreId = null;
    if (this.state.filterStoreId === storeId) patch.filterStoreId = "all";
    if (Object.keys(patch).length) this.setState(patch);
  };

  // Restablecer catálogo de fábrica
  resetCatalog = () => {
    if (!confirm("¿Restablecer catálogo a los valores originales?")) return;
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
                              <button className="btn btn-secondary" onClick={() => this.addToCart(it)}>
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
          ))}
        </div>
      </section>
    );
  }
}

