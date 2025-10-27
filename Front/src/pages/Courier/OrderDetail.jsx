import React from "react";
import { useParams } from "react-router-dom";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus from "../../oop/models/OrderStatus";

function withParams(Component) {
  return (props) => <Component {...props} params={useParams()} />;
}

class OrderDetail extends React.Component {
  state = { order: null, notFound: false, modal: false, loading: false, statusError: null };

  componentDidMount() {
    this.load();
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, () => this.load(false));
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  async load(force = true) {
    const { id } = this.props.params;
    this.setState({ loading: true, notFound: false });
    try {
      const order = await appState.getOrder(id, { force });
      if (!order) {
        this.setState({ order: null, notFound: true, loading: false });
      } else {
        this.setState({ order, notFound: false, loading: false, statusError: null });
      }
    } catch (_error) {
      this.setState({ order: null, notFound: true, loading: false });
    }
  }

  async updateStatus(status) {
    if (!this.state.order) return;
    this.setState({ statusError: null });
    try {
      await appState.updateStatus(this.state.order.id, status);
      this.setState({ modal: false });
    } catch (error) {
      this.setState({ statusError: error.message || "No se pudo actualizar el estado" });
    }
  }

  render() {
    if (this.state.notFound) return <div className="card">Pedido no encontrado.</div>;
    if (this.state.loading && !this.state.order) {
      return <div className="card">Cargando pedido...</div>;
    }

    const o = this.state.order;
    if (!o) return null;

    const userRole = appState.user?.role;

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h1 className="text-xl font-semibold">Pedido #{o.id}</h1>
            {o.store?.name && <p className="text-slate-500 mt-1">{o.store.name}</p>}
            <ul className="mt-3 space-y-2">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between">
                  <span className="text-slate-700">{it.qty} × {it.name}</span>
                  <span className="text-slate-500">S/ {Number(it.price ?? 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {(o.history && o.history.length) ? (
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Historial de estado</h2>
              <ul className="space-y-2 text-sm">
                {o.history.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium capitalize">{h.status}</p>
                      {h.notes && <p className="text-slate-500">{h.notes}</p>}
                    </div>
                    <span className="text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <aside className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado</span>
              <span className="pill capitalize">{o.status}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold">S/ {Number(o.total ?? 0).toFixed(2)}</span>
            </div>
            {o.address && (
              <div className="mt-3">
                <p className="text-slate-500 text-sm">Dirección</p>
                <p className="font-medium">{o.address}</p>
              </div>
            )}
            {o.notes && (
              <div className="mt-3">
                <p className="text-slate-500 text-sm">Notas</p>
                <p className="font-medium">{o.notes}</p>
              </div>
            )}

            {userRole === "courier" && (
              <button
                onClick={() => this.setState({ modal: true })}
                className="btn btn-primary w-full mt-4"
              >
                Actualizar estado
              </button>
            )}
          </div>

          {this.state.statusError && (
            <div className="card text-sm text-rose-600 bg-rose-50 border border-rose-100">
              {this.state.statusError}
            </div>
          )}
        </aside>

        {userRole === "courier" && this.state.modal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="card w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-2">Actualizar estado</h3>
              <div className="grid gap-2">
                {[OrderStatus.ACCEPTED, OrderStatus.PICKED, OrderStatus.ON_ROUTE, OrderStatus.DELIVERED, OrderStatus.CANCELED]
                  .map((s) => (
                    <button
                      key={s}
                      className={`btn w-full ${s === OrderStatus.DELIVERED ? "btn-primary" : ""}`}
                      onClick={() => this.updateStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
              </div>
              <button onClick={() => this.setState({ modal: false })} className="btn w-full mt-3">Cerrar</button>
            </div>
          </div>
        )}
      </section>
    );
  }
}

export default withParams(OrderDetail);
