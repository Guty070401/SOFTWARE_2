import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

const STORE_IMAGE_PLACEHOLDER = "https://via.placeholder.com/80?text=Tienda";
const PRODUCT_IMAGE_PLACEHOLDER = "https://via.placeholder.com/80?text=Producto";

class CustomerOrders extends React.Component {
  state = { orders: [], loading: false, error: null };

  componentDidMount() {
    this._mounted = true;
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders) =>
      this.setState({ orders })
    );
    this.setState({ orders: appState.orders });
    this.loadOrders();
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
    this._mounted = false;
  }

  async loadOrders(){
    if (!this._mounted) return;
    this.setState({ loading: true, error: null });
    try {
      const orders = await appState.ensureOrdersLoaded();
      if (orders && this._mounted) {
        this.setState({ orders });
      }
    } catch (error) {
      if (this._mounted) {
        this.setState({ error: error?.message || 'No se pudieron cargar los pedidos.' });
      }
    } finally {
      if (this._mounted) {
        this.setState({ loading: false });
      }
    }
  }

  openOrder(id) {
    this.props.navigate(`/courier/order/${id}`); // usa la misma vista de detalle
  }

  volverATienda() {
    this.props.navigate("/customer"); // redirige al main o tienda
  }

  render() {
    const { orders } = this.state;

    return (
      <section>
        <h1 className="text-2xl font-semibold mb-4">Pedidos Realizados</h1>

        {this.state.loading && (
          <p className="text-sm text-slate-500 mb-3">Cargando pedidos...</p>
        )}

        {this.state.error && (
          <div className="p-3 mb-3 rounded bg-rose-100 text-rose-700 text-sm">
            {this.state.error}
          </div>
        )}

        {!orders.length ? (
          <div className="card text-center">
            <p className="text-slate-500 mb-4">
              Aún no has realizado ningún pedido.
            </p>
            <button
              onClick={() => this.volverATienda()}
              className="btn btn-secondary"
            >
              Volver a la tienda
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((o) => {
                const store = o.store || {};
                const storeName = store.name || store.nombre || "Tienda";
                const storeImage = store.image || store.logo || STORE_IMAGE_PLACEHOLDER;
                const previewItems = (o.items || []).slice(0, 3);
                return (
                  <div key={o.id} className="card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={storeImage}
                          alt={storeName}
                          className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm text-slate-500">Pedido #{o.id}</p>
                          <p className="font-semibold">{storeName}</p>
                          <p className="text-xs text-slate-500 mt-1">{o.items.length} ítems</p>
                        </div>
                      </div>
                      <span className="pill capitalize">{o.status}</span>
                    </div>

                    {!!previewItems.length && (
                      <div className="mt-3 flex -space-x-2 overflow-hidden">
                        {previewItems.map((item) => {
                          const image = item.image || PRODUCT_IMAGE_PLACEHOLDER;
                          return (
                            <img
                              key={item.id}
                              src={image}
                              alt={item.name}
                              className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                              title={item.name}
                            />
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <span className="font-semibold">S/ {o.total}</span>
                      <button
                        className="btn btn-primary"
                        onClick={() => this.openOrder(o.id)}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón de volver a tienda debajo de los pedidos */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => this.volverATienda()}
                className="btn btn-secondary"
              >
                Volver a la tienda
              </button>
            </div>
          </>
        )}
      </section>
    );
  }
}

export default withNavigate(CustomerOrders);
