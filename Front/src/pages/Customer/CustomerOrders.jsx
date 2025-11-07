import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class CustomerOrders extends React.Component {
  state = { orders: [], loading: true, error: null };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders) =>
      this.setState({ orders, loading: false })
    );
    this.setState({ orders: appState.orders, loading: false });
    appState.refreshOrders({ force: true }).catch((error) => {
      const message = error?.message || "No se pudieron obtener los pedidos.";
      this.setState({ error: message, loading: false });
    });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  openOrder(id) {
    this.props.navigate(`/courier/order/${id}`); // usa la misma vista de detalle
  }

  volverATienda() {
    this.props.navigate("/customer"); // redirige al main o tienda
  }

  render() {
    const { orders, loading, error } = this.state;

    return (
      <section>
        <h1 className="text-2xl font-semibold mb-4">Pedidos Realizados</h1>

        {error && (
          <div className="card border-rose-200 bg-rose-50 text-rose-700 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="card">Cargando pedidos...</div>
        ) : !orders.length ? (
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
              {orders.map((o) => (
                <div key={o.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Pedido</p>
                      <p className="font-semibold">#{o.id}</p>
                    </div>
                    <span className="pill capitalize">{o.status}</span>
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
              ))}
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
