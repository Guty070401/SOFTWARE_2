import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class CustomerOrders extends React.Component {
  state = { orders: [], loading: false };

  componentDidMount() {
    this.unsubOrders = appState.on(EVENTS.ORDERS_CHANGED, (orders) => this.setState({ orders }));
    this.unsubAuth = appState.on(EVENTS.AUTH_CHANGED, (user) => {
      if (!user) {
        this.setState({ orders: [] });
      } else {
        this.fetchOrders();
      }
    });
    this.setState({ orders: appState.orders });
    if (appState.user) {
      this.fetchOrders();
    }
  }

  componentWillUnmount() {
    this.unsubOrders && this.unsubOrders();
    this.unsubAuth && this.unsubAuth();
  }

  async fetchOrders() {
    this.setState({ loading: true });
    try {
      await appState.loadOrders(true);
    } finally {
      this.setState({ loading: false });
    }
  }

  openOrder(id) {
    this.props.navigate(`/courier/order/${id}`);
  }

  volverATienda() {
    this.props.navigate("/customer");
  }

  render() {
    if (!appState.user) {
      return (
        <section>
          <div className="card">
            <p className="text-slate-500">Inicia sesión para ver tus pedidos.</p>
            <button className="btn btn-primary mt-3" onClick={() => this.props.navigate("/", { replace: true })}>
              Ir al inicio
            </button>
          </div>
        </section>
      );
    }

    const { orders, loading } = this.state;

    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Pedidos Realizados</h1>
          <button className="pill" onClick={() => this.fetchOrders()} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {!orders.length ? (
          <div className="card text-center">
            <p className="text-slate-500 mb-4">
              {loading ? "Cargando pedidos..." : "Aún no has realizado ningún pedido."}
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
              {orders.map((o) => (
                <div key={o.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Pedido</p>
                      <p className="font-semibold">#{o.id}</p>
                      {o.store?.name && (
                        <p className="text-xs text-slate-500 mt-1">{o.store.name}</p>
                      )}
                    </div>
                    <span className="pill capitalize">{o.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {o.items.length} ítems
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-semibold">S/ {Number(o.total ?? 0).toFixed(2)}</span>
                    <button
                      className="btn btn-primary"
                      onClick={() => this.openOrder(o.id)}
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              ))}
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
