import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";

import { syncCatalog } from "../../services/catalog";
import { StoresApi } from "../../services/storeService";

const ADMIN_EMAIL = "admin@ulima.edu.pe";

function getCurrentUserEmail() {
  const userFromState = appState.user;
  const userFromStorage =
    JSON.parse(localStorage.getItem("user") || "null") ||
    JSON.parse(localStorage.getItem("auth") || "null");

  const user = userFromState || userFromStorage;

  return (
    user?.email ||
    user?.correo ||
    user?.user?.email ||
    user?.user?.correo ||
    ""
  ).toLowerCase();
}

export class CustomerHome extends React.Component {
  state = {
    cartCount: 0,
    selectedStoreId: null,
    filterStoreId: "all",
    stores: [],
    isAdmin: false,
  };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => {
      this.setState({ cartCount: cartItems.length });
    });

    const email = getCurrentUserEmail();
    const isAdmin = email === ADMIN_EMAIL;

    this.setState({
      cartCount: appState.cart.length,
      isAdmin,
    });

    this.loadStoresFromBackend();
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
    } catch {}
  };

  manualSyncCatalog = async () => {
    if (!this.state.isAdmin) return;

    try {
      await syncCatalog();
      localStorage.setItem("catalog_synced", "1");
      alert("Catálogo sincronizado correctamente");
    } catch (err) {
      console.error("Error sincronizando catálogo:", err);
      alert("Error sincronizando catálogo");
    }
  };

  loadStoresFromBackend = async () => {
    try {
      const { stores } = await StoresApi.list();
      const mapped = (stores || []).map((store) => ({
        id: store.id,
        name: store.nombre,
        desc: store.descripcion || "",
        image:
          store.logo ||
          "https://via.placeholder.com/160x160?text=Tienda",
        items: (store.productos || []).map((p) => ({
          id: p.id,
          name: p.nombre,
          desc: p.descripcion || "",
          price: Number(p.precio),
          image:
            p.foto ||
            "https://via.placeholder.com/640x400?text=Producto",
        })),
      }));

      this.saveStores(mapped);
    } catch (err) {
      console.error("Error cargando tiendas:", err);
      this.saveStores([]);
    }
  };

  saveStores = (stores) => {
    this.setState({ stores });
    localStorage.setItem("catalog_stores", JSON.stringify(stores));
  };

  addStore = async () => {
    if (!this.state.isAdmin) return;

    const name = prompt("Nombre de la tienda:");
    if (!name) return;

    const desc = prompt("Descripción:", "") || "";
    const image =
      prompt("URL del logo:", "") ||
      "https://via.placeholder.com/160x160?text=Tienda";

    const id = name.toLowerCase().replace(/\s+/g, "_");

    try {
      await StoresApi.create({ id, nombre: name, descripcion: desc, logo: image });
    } catch {
      return alert("Error creando tienda");
    }

    this.loadStoresFromBackend();
  };

  removeStore = async (storeId) => {
    if (!this.state.isAdmin) return;
    if (!confirm("¿Eliminar esta tienda?")) return;

    try {
      await StoresApi.remove(storeId);
    } catch {
      return alert("Error eliminando tienda");
    }

    this.loadStoresFromBackend();
  };

  addProductToStore = async (storeId) => {
    if (!this.state.isAdmin) return;

    const name = prompt("Nombre del producto:");
    if (!name) return;

    const price = parseFloat(prompt("Precio:", "0"));
    const desc = prompt("Descripción:", "") || "";
    const image =
      prompt("URL de imagen:", "") ||
      "https://via.placeholder.com/640x400?text=Producto";

    const id = `${storeId}_${name.toLowerCase().replace(/\s+/g, "_")}`;

    try {
      await StoresApi.createProduct(storeId, {
        id,
        nombre: name,
        descripcion: desc,
        precio: price,
        foto: image,
      });
    } catch {
      return alert("Error creando producto");
    }

    this.loadStoresFromBackend();
    this.setState({ selectedStoreId: storeId });
  };

  removeProductFromStore = async (storeId, productId) => {
    if (!this.state.isAdmin) return;
    if (!confirm("¿Eliminar producto?")) return;

    try {
      await StoresApi.removeProduct(productId);
    } catch {
      return alert("Error eliminando producto");
    }

    this.loadStoresFromBackend();
  };

  // ===============================
  // CARRITO
  // ===============================
  addToCart = (item, store) => {
    const itemForCart = {
      id: item.id,
      name: item.name,
      price: item.price,
      desc: item.desc,
      image: item.image,
      qty: 1,
      storeId: store.id,
    };
    appState.addToCart(itemForCart);
  };

  render() {
    const stores = this.state.stores;
    const isAdmin = this.state.isAdmin;

    return (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Tiendas</h1>
            <p className="text-slate-500">
              Elige tus productos favoritos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button className="pill" onClick={this.addStore}>
                + Agregar tienda
              </button>
            )}

            {isAdmin && (
              <button className="pill" onClick={this.manualSyncCatalog}>
                Sincronizar catálogo
              </button>
            )}

            <Link to="/customer/orders" className="pill">
              Ver pedidos
            </Link>

            <Link to="/customer/cart" className="pill">
              Carrito ({this.state.cartCount})
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {stores.map((store) => (
            <div key={store.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={store.image}
                  alt={store.name}
                  className="h-24 w-24 object-cover rounded-xl"
                />

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold">{store.name}</h3>
                  <p className="text-slate-500">{store.desc}</p>
                </div>

                <div className="flex gap-2">
                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-outline"
                        onClick={() => this.addProductToStore(store.id)}
                      >
                        + Producto
                      </button>

                      <button
                        className="btn btn-danger"
                        onClick={() => this.removeStore(store.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      this.setState({
                        selectedStoreId:
                          this.state.selectedStoreId === store.id
                            ? null
                            : store.id,
                      })
                    }
                  >
                    {this.state.selectedStoreId === store.id
                      ? "Cerrar"
                      : "Ver Productos"}
                  </button>
                </div>
              </div>

              {/* PRODUCTOS */}
              {this.state.selectedStoreId === store.id && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">
                    Productos de {store.name}
                  </h4>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {store.items.map((it) => (
                      <div
                        key={it.id}
                        className="card p-0 overflow-hidden flex flex-col"
                      >
                        <img
                          src={it.image}
                          className="w-full h-40 object-cover"
                        />

                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold">{it.name}</h3>
                          <p className="text-sm text-slate-500">
                            {it.desc}
                          </p>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="font-semibold">
                              S/ {it.price}
                            </span>

                            <div className="flex gap-2">
                              <button
                                className="btn btn-secondary"
                                onClick={() =>
                                  this.addToCart(it, store)
                                }
                              >
                                Agregar
                              </button>

                              {isAdmin && (
                                <button
                                  className="btn btn-danger"
                                  onClick={() =>
                                    this.removeProductFromStore(
                                      store.id,
                                      it.id
                                    )
                                  }
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {store.items.length === 0 && (
                      <p className="text-slate-500 italic">
                        No hay productos.
                      </p>
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
