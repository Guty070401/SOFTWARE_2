import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";
import Item from "../../oop/models/Item";
import { EVENTS } from "../../oop/state/events";
import StoreService from "../../oop/services/StoreService";

import imgBembosLogo from "../../assets/images/bembos-logo.png";
import imgBembosNuggets from "../../assets/images/nuggets.jpg";
import imgBembosExtrema from "../../assets/images/hamburguesa-extrema.jpg";

import imgNeveraLogo from "../../assets/images/neverafit-logo.jpg";
import imgNeveraAcai from "../../assets/images/bowl-acai.jpg";
import imgNeveraTostadas from "../../assets/images/pan-palta.jpg";

import imgSushiLogo from "../../assets/images/sushi-logo.jpg";
import imgSushiAcevichado from "../../assets/images/makis-acevichado.jpg";
import imgSushiPoke from "../../assets/images/poke-atun.jpg";

const storeService = new StoreService();
const PLACEHOLDER_STORE = "https://via.placeholder.com/160x160?text=Tienda";
const PLACEHOLDER_PRODUCT = "https://via.placeholder.com/640x400?text=Producto";

const DEFAULT_STORES = [
  {
    id: "s1",
    name: "Bembos",
    desc: "Las hamburguesas más bravas",
    image: imgBembosLogo,
    items: [
      new Item("p1", "Nuggets", 18, "¡Prueba nuestros deliciosos Nuggets de pollo!", imgBembosNuggets, 1, "s1", "Bembos"),
      new Item(
        "p2",
        "Hamburguesa Extrema",
        20.9,
        "Doble carne, queso Edam, tocino, tomate, lechuga y mayonesa.",
        imgBembosExtrema,
        1,
        "s1",
        "Bembos"
      )
    ]
  },
  {
    id: "s2",
    name: "La Nevera Fit",
    desc: "Tus desayunos siempre ganan",
    image: imgNeveraLogo,
    items: [
      new Item("p3", "Açai Bowl", 25, "Con granola, plátano, fresas y arándanos.", imgNeveraAcai, 1, "s2", "La Nevera Fit"),
      new Item("p4", "Tostadas con Palta", 15, "Dos tostadas de pan integral con palta y semillas.", imgNeveraTostadas, 1, "s2", "La Nevera Fit")
    ]
  },
  {
    id: "s3",
    name: "Mr. Sushi",
    desc: "Cada maki es un bocado de pura felicidad",
    image: imgSushiLogo,
    items: [
      new Item(
        "p5",
        "Acevichado Maki",
        28,
        "Roll de langostino empanizado y palta, cubierto con láminas de pescado blanco.",
        imgSushiAcevichado,
        1,
        "s3",
        "Mr. Sushi"
      ),
      new Item(
        "p6",
        "Poke Atún Fresco",
        29.9,
        "Base de arroz sushi, salsa de ostión, col morada, zanahoria y cubos de Atún.",
        imgSushiPoke,
        1,
        "s3",
        "Mr. Sushi"
      )
    ]
  }
];

function mapApiStore(store) {
  if (!store) return null;
  const id = store.id ?? store.storeId ?? store.tiendaId;
  const name = store.name ?? store.nombre ?? store.nombreOrigen ?? "Tienda";
  const desc = store.desc ?? store.descripcion ?? "";
  const image = store.image ?? store.logo ?? PLACEHOLDER_STORE;

  const items = (store.items ?? store.productos ?? []).map((product) => new Item(
    product.id ?? product.productoId,
    product.name ?? product.nombre ?? "Producto",
    Number(product.price ?? product.precio ?? 0),
    product.desc ?? product.descripcion ?? "",
    product.image ?? product.foto ?? PLACEHOLDER_PRODUCT,
    1,
    id,
    name
  ));

  return {
    id,
    name,
    desc,
    image,
    items
  };
}

export default class CustomerHome extends React.Component {
  state = {
    cartCount: 0,
    selectedStoreId: null,
    filterStoreId: "all",
    stores: [],
    loading: true,
    error: null,
    cartError: null
  };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });
    this.setState({ cartCount: appState.cart.length });
    this.loadStores();
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  loadStores = async () => {
    this.setState({ loading: true, error: null });
    try {
      const stores = await storeService.listStores();
      const mapped = stores.map(mapApiStore).filter(Boolean);
      if (mapped.length) {
        this.setState({ stores: mapped, loading: false });
      } else {
        this.setState({
          stores: DEFAULT_STORES,
          loading: false,
          error: "No se encontraron tiendas en la base de datos. Se muestran datos de ejemplo."
        });
      }
    } catch (error) {
      const message = error?.message || "No se pudieron cargar las tiendas.";
      this.setState({
        stores: DEFAULT_STORES,
        loading: false,
        error: `${message} Se muestran datos de ejemplo.`
      });
    }
  };

  addToCart = (store, item) => {
    try {
      const itemForCart = new Item(
        item.id,
        item.name,
        Number(item.price),
        item.desc,
        item.image,
        1,
        store.id,
        store.name
      );
      appState.addToCart(itemForCart);
      this.setState({ cartCount: appState.cart.length, cartError: null });
    } catch (error) {
      const message = error?.message || "No se pudo agregar el producto.";
      this.setState({ cartError: message });
    }
  };

  handleToggleStore = (storeId) => {
    this.setState((prev) => ({
      selectedStoreId: prev.selectedStoreId === storeId ? null : storeId
    }));
  };

  render() {
    const baseStores = this.state.stores.length ? this.state.stores : DEFAULT_STORES;
    const storesToRender = this.state.filterStoreId === "all"
      ? baseStores
      : baseStores.filter((s) => s.id === this.state.filterStoreId);

    return (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Tiendas</h1>
            <p className="text-slate-500">Elige tu tienda y platos favoritos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="pill"
              onClick={this.loadStores}
              disabled={this.state.loading}
            >
              {this.state.loading ? "Cargando..." : "Recargar"}
            </button>
            <Link to="/customer/cart" className="pill">
              Carrito ({this.state.cartCount})
            </Link>
            <Link to="/customer/orders" className="pill">
              Ver pedidos
            </Link>
          </div>
        </div>

        {this.state.error && (
          <div className="card border-amber-200 bg-amber-50 text-amber-700 mb-4">
            {this.state.error}
          </div>
        )}

        {this.state.cartError && (
          <div className="card border-rose-200 bg-rose-50 text-rose-700 mb-4">
            {this.state.cartError}
          </div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Establecimiento:</label>
          <select
            className="border rounded px-2 py-1"
            value={this.state.filterStoreId}
            onChange={(e) => this.setState({ filterStoreId: e.target.value, selectedStoreId: null })}
          >
            <option value="all">Todos</option>
            {baseStores.map((s) => (
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

        {this.state.loading ? (
          <div className="card">Cargando tiendas...</div>
        ) : (
          <div className="flex flex-col gap-6">
            {storesToRender.map((store) => (
              <div key={store.id} className="card">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <img
                    src={store.image || PLACEHOLDER_STORE}
                    alt={store.name}
                    className="h-24 w-24 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-semibold">{store.name}</h3>
                    <p className="text-slate-500">{store.desc}</p>
                  </div>
                  <div className="flex gap-2">
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
                      {(store.items || []).map((it) => (
                        <div key={it.id} className="card p-0 overflow-hidden flex flex-col">
                          <img
                            src={it.image || PLACEHOLDER_PRODUCT}
                            alt={it.name}
                            className="w-full h-40 object-cover"
                          />
                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-semibold">{it.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-3">{it.desc}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <span className="font-semibold">S/ {Number(it.price).toFixed(2)}</span>
                              <button
                                className="btn btn-secondary"
                                onClick={() => this.addToCart(store, it)}
                              >
                                Agregar
                              </button>
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

            {!storesToRender.length && !this.state.loading && (
              <div className="card">No se encontraron tiendas.</div>
            )}
          </div>
        )}
      </section>
    );
  }
}
