import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

export class CustomerOrders extends React.Component {
  state = { orders: [], loading: true, error: "" };

  componentDidMount() {
    this._isMounted = true;
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders) => {
      if (!this._isMounted) return;
      this.setState({ orders, loading: false });
    });

    const hasSnapshot = Array.isArray(appState.orders);
    const initialOrders = hasSnapshot ? appState.orders : [];
    this.setState({ orders: initialOrders, loading: !hasSnapshot, error: "" });

    if (typeof appState.fetchOrders === "function") {
      Promise.resolve()
        .then(() => appState.fetchOrders())
        .then((maybeOrders) => {
          if (!this._isMounted) return;
          if (Array.isArray(maybeOrders)) {
            this.setState((prev) =>
              prev.orders.length ? null : { orders: maybeOrders }
            );
          }
        })
        .catch((err) => {
          if (!this._isMounted) return;
          this.setState({
            error: err?.message || "No se pudieron cargar los pedidos",
          });
        })
        .finally(() => {
          if (!this._isMounted) return;
          this.setState({ loading: false });
        });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.unsub && this.unsub();
  }

  openOrder(id) {
    // Reusa la misma vista de detalle
    this.props.navigate(`/courier/order/${id}`);
  }

  volverATienda() {
    this.props.navigate("/customer");
  }

  render() {
    const { orders, loading, error } = this.state;

    return (
      <section>
        <h1 className="text-2xl font-semibold mb-4">Pedidos Realizados</h1>

        {loading ? (
          <div className="card text-center">
            <p className="text-slate-500">Cargando pedidos...</p>
          </div>
        ) : !orders.length ? (
          <div className="card text-center">
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
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
                const rawStatus = String(o.status || "");
                const statusNorm = rawStatus.toLowerCase();
                const isDelivered =
                  statusNorm === "delivered" || statusNorm === "entregado";

                return (
                  <div key={o.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Pedido</p>
                        <p className="font-semibold">#{o.id}</p>
                      </div>

                      {/* Badge de estado con check verde si está entregado */}
                      <span
  className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize inline-flex items-center gap-1
    ${
      isDelivered
        ? "bg-green-100 text-green-700 border-green-300"
        : "bg-slate-100 text-slate-700 border-slate-300"
    }
  `}
>
  {isDelivered && <span className="text-base leading-none">✓</span>}
  {isDelivered ? "Entregado" : o.status}
</span>

                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      {o.items.length} ítems
                    </p>
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
