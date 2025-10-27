import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class CourierHome extends React.Component {
  state = { orders: [], loading: false };

  componentDidMount() {
    this.unsubOrders = appState.on(EVENTS.ORDERS_CHANGED, (orders) => this.setState({ orders }));
    this.unsubAuth = appState.on(EVENTS.AUTH_CHANGED, () => this.bootstrap());
    this.setState({ orders: appState.orders });
    this.bootstrap();
  }

  componentWillUnmount() {
    this.unsubOrders && this.unsubOrders();
    this.unsubAuth && this.unsubAuth();
  }

  async bootstrap() {
    if (!appState.user || appState.user.role !== "courier") {
      this.setState({ orders: [] });
      return;
    }
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

  render() {
    const user = appState.user;
    if (!user) {
      return (
        <section>
          <div className="card">
            <p className="text-slate-500">Inicia sesión para ver pedidos asignados.</p>
            <button className="btn btn-primary mt-3" onClick={() => this.props.navigate("/", { replace: true })}>
              Ir al inicio
            </button>
          </div>
        </section>
      );
    }

    if (user.role !== "courier") {
      return (
        <section>
          <div className="card">
            <p className="text-slate-500">Cambia tu rol a repartidor para ver los pedidos disponibles.</p>
            <button className="btn btn-primary mt-3" onClick={() => this.props.navigate("/choose-role")}>Elegir rol</button>
          </div>
        </section>
      );
    }

    const { orders, loading } = this.state;

    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Pedidos asignados</h1>
          <button className="pill" onClick={() => this.bootstrap()} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
        {!orders.length ? (
          <div className="card">
            <p className="text-slate-500">{loading ? "Cargando pedidos..." : "No hay pedidos aún."}</p>
          </div>
        ) : (
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
                <p className="text-sm text-slate-500 mt-2">{o.items.length} ítems</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">S/ {Number(o.total ?? 0).toFixed(2)}</span>
                  <button className="btn btn-primary" onClick={() => this.openOrder(o.id)}>Ver detalle</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }
}

export default withNavigate(CourierHome);
