import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";

import imgBembosLogo from "../../assets/images/bembos-logo.png";
import imgBembosNuggets from "../../assets/images/nuggets.jpg";
import imgBembosExtrema from "../../assets/images/hamburguesa-extrema.jpg";

import imgNeveraLogo from "../../assets/images/neverafit-logo.jpg";
import imgNeveraAcai from "../../assets/images/bowl-acai.jpg";
import imgNeveraTostadas from "../../assets/images/pan-palta.jpg";

import imgSushiLogo from "../../assets/images/sushi-logo.jpg";
import imgSushiAcevichado from "../../assets/images/makis-acevichado.jpg";
import imgSushiPoke from "../../assets/images/poke-atun.jpg";

const PLACEHOLDER_STORE = "https://via.placeholder.com/160x160?text=Tienda";
const PLACEHOLDER_PRODUCT = "https://via.placeholder.com/640x400?text=Producto";

const MEDIA_BY_STORE = {
  bembos: {
    store: imgBembosLogo,
    items: {
      nuggets: imgBembosNuggets,
      "hamburguesa extrema": imgBembosExtrema,
    },
  },
  "la nevera fit": {
    store: imgNeveraLogo,
    items: {
      "açai bowl": imgNeveraAcai,
      "acai bowl": imgNeveraAcai,
      "tostadas con palta": imgNeveraTostadas,
    },
  },
  "mr. sushi": {
    store: imgSushiLogo,
    items: {
      "acevichado maki": imgSushiAcevichado,
      "poke atún fresco": imgSushiPoke,
      "poke atun fresco": imgSushiPoke,
    },
  },
  "mr sushi": {
    store: imgSushiLogo,
    items: {
      "acevichado maki": imgSushiAcevichado,
      "poke atún fresco": imgSushiPoke,
      "poke atun fresco": imgSushiPoke,
    },
  },
};

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getDefaultStoreMedia(store) {
  const nameKey = normalizeKey(store?.name ?? store?.nombre);
  return MEDIA_BY_STORE[nameKey] ?? null;
}

function getStoreImage(store) {
  return (
    store?.image ||
    store?.logo ||
    getDefaultStoreMedia(store)?.store ||
    null
  );
}

function getProductImage(store, item) {
  return (
    item?.image ||
    item?.imagen ||
    getDefaultStoreMedia(store)?.items?.[normalizeKey(item?.name ?? item?.nombre)] ||
    null
  );
}

export default class CustomerHome extends React.Component {
  state = {
    cartCount: appState.cart.length,
    selectedStoreId: null,
    filterStoreId: "all",
    stores: appState.stores || [],
    loading: false,
    error: null,
  };

  componentDidMount() {
    this.unsubCart = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });
    this.unsubStores = appState.on(EVENTS.STORES_CHANGED, (stores) => {
      this.setState({ stores, loading: false, error: null });
    });

    if (!appState.stores || !appState.stores.length) {
      this.fetchStores();
    }
  }

  componentWillUnmount() {
    this.unsubCart && this.unsubCart();
    this.unsubStores && this.unsubStores();
  }

  async fetchStores() {
    this.setState({ loading: true, error: null });
    try {
      await appState.loadStores(true);
    } catch (error) {
      this.setState({ loading: false, error: error.message || "No se pudo cargar el catálogo" });
    }
  }

  handleToggleStore(storeId) {
    this.setState((prev) => ({
      selectedStoreId: prev.selectedStoreId === storeId ? null : storeId,
    }));
  }

  handleAddToCart(store, item) {
    try {
      appState.addToCart({
        ...item,
        image: getProductImage(store, item) || PLACEHOLDER_PRODUCT,
        storeId: store.id,
      }, store.id);
    } catch (error) {
      alert(error.message || "No se pudo agregar el producto");
    }
  }

  render() {
    const { stores, filterStoreId, selectedStoreId, loading, error, cartCount } = this.state;
    const storesToRender = filterStoreId === "all"
      ? stores
      : stores.filter((s) => s.id === filterStoreId);

    return (
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Tiendas</h1>
            <p className="text-slate-500">Explora los restaurantes disponibles y arma tu pedido.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="pill" onClick={() => this.fetchStores()} disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
            <Link to="/customer/cart" className="pill">
              Carrito ({cartCount})
            </Link>
            <Link to="/customer/orders" className="pill">
              Ver pedidos
            </Link>
          </div>
        </div>

        {error && (
          <div className="card mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Establecimiento:</label>
          <select
            className="border rounded px-2 py-1"
            value={filterStoreId}
            onChange={(e) => this.setState({ filterStoreId: e.target.value, selectedStoreId: null })}
          >
            <option value="all">Todos</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {filterStoreId !== "all" && (
            <button
              className="btn"
              onClick={() => this.setState({ filterStoreId: "all", selectedStoreId: null })}
            >
              Ver todos
            </button>
          )}
        </div>

        {loading && !stores.length ? (
          <div className="card">Cargando tiendas...</div>
        ) : (
          <div className="flex flex-col gap-6">
            {storesToRender.map((store) => {
              const storeName = store.name || store.nombre || "Tienda";
              const storeImage = getStoreImage(store) || PLACEHOLDER_STORE;
              const storeDescription = store.desc || store.description || store.descripcion || "";
              return (
                <div key={store.id} className="card">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <img
                      src={storeImage}
                      alt={storeName}
                      className="h-24 w-24 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-semibold">{storeName}</h3>
                      <p className="text-slate-500">{storeDescription}</p>
                    </div>
                    <button
                      className="btn btn-primary self-center flex-shrink-0"
                      onClick={() => this.handleToggleStore(store.id)}
                    >
                      {selectedStoreId === store.id ? "Cerrar" : "Ver Productos"}
                    </button>
                  </div>

                  {selectedStoreId === store.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-semibold mb-2">Productos de {storeName}</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(store.items || []).map((it) => {
                          const productName = it.name || it.nombre || "Producto";
                          const productImage = getProductImage(store, it) || PLACEHOLDER_PRODUCT;
                          const productDesc = it.desc || it.description || it.descripcion || "";
                          return (
                            <div key={it.id} className="card p-0 overflow-hidden flex flex-col">
                              <img
                                src={productImage}
                                alt={productName}
                                className="w-full h-40 object-cover"
                              />
                              <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold">{productName}</h3>
                                <p className="text-sm text-slate-500 line-clamp-3">{productDesc}</p>
                                <div className="mt-4 flex items-center justify-between">
                                  <span className="font-semibold">S/ {Number(it.price ?? 0).toFixed(2)}</span>
                                  <button className="btn btn-secondary" onClick={() => this.handleAddToCart(store, it)}>
                                    Agregar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {(store.items || []).length === 0 && (
                          <div className="text-slate-500 italic">No hay productos disponibles.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!storesToRender.length && !loading && (
              <div className="card text-slate-500">No encontramos tiendas para mostrar.</div>
            )}
          </div>
        )}
      </section>
    );
  }
}
