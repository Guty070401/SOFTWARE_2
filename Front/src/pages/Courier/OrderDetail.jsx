import React from "react";
import { useParams } from "react-router-dom";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus from "../../oop/models/OrderStatus";

// Helper wrapper para obtener params en clase
function withParams(Component){
  return (props)=> <Component {...props} params={useParams()} />;
}

class OrderDetail extends React.Component {
  state = { order: null, notFound: false, modal: false, loading: true, error: null, statusError: null };

  componentDidMount(){
    this._mounted = true;
    this.load();
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, ()=> this.load());
  }
  componentWillUnmount(){
    this._mounted = false;
    this.unsub && this.unsub();
  }

  async load() {
    const { id } = this.props.params;
    if (!id) {
      this._mounted && this.setState({ order: null, notFound: true, loading: false });
      return;
    }

    const existing = appState.orders.find((x) => String(x.id) === String(id));
    if (existing) {
      this._mounted && this.setState({ order: existing, notFound: false, loading: false });
      return;
    }

    this._mounted && this.setState({ loading: true, error: null });
    try {
      const order = await appState.fetchOrder(id);
      if (!this._mounted) return;
      if (!order) {
        this.setState({ order: null, notFound: true, loading: false });
      } else {
        this.setState({ order, notFound: false, loading: false });
      }
    } catch (error) {
      if (!this._mounted) return;
      const message = error?.message || "No se pudo cargar el pedido.";
      this.setState({ error: message, loading: false });
    }
  }

  async updateStatus(s){
    if (!this.state.order) return;
    this.setState({ statusError: null });
    try {
      const updated = await appState.updateStatus(this.state.order.id, s);
      if (updated) {
        this.setState({ order: updated, modal: false });
      } else {
        this.setState({ modal: false });
      }
    } catch (error) {
      const message = error?.message || "No se pudo actualizar el estado.";
      this.setState({ statusError: message, modal: false });
    }
  }

  render(){
    if (this.state.loading) {
      return <div className="card">Cargando pedido...</div>;
    }
    if (this.state.error) {
      return <div className="card border-rose-200 bg-rose-50 text-rose-700">{this.state.error}</div>;
    }
    if (this.state.notFound) return <div className="card">Pedido no encontrado.</div>;
    const o = this.state.order;
    if (!o) return null;

    // Obtenemos el rol actual del usuario
    const userRole = appState.user?.role;

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-xl font-semibold">Pedido #{o.id}</h1>
            <ul className="mt-3 space-y-2">
              {o.items.map(it => (
                <li key={it.id} className="flex items-center justify-between">
                  <span className="text-slate-700">{it.name}</span>
                  <span className="text-slate-500">S/ {it.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <aside>
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado</span>
              <span className="pill capitalize">{o.status}</span>
            </div>
            {o.store?.name && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-500">Tienda</span>
                <span className="font-medium">{o.store.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold">S/ {o.total}</span>
            </div>

            {this.state.statusError && (
              <p className="text-sm text-rose-600 mt-2">{this.state.statusError}</p>
            )}

            {/* Solo el repartidor puede actualizar estado */}
            {userRole === "courier" && (
              <button
                onClick={()=>this.setState({ modal:true })}
                className="btn btn-primary w-full mt-4"
              >
                Actualizar estado
              </button>
            )}
          </div>
        </aside>

        {/* Modal visible solo si es courier */}
        {userRole === "courier" && this.state.modal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="card w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-2">Actualizar estado</h3>
              <div className="grid gap-2">
                {[OrderStatus.ACCEPTED, OrderStatus.PICKED, OrderStatus.ON_ROUTE, OrderStatus.DELIVERED, OrderStatus.CANCELED]
                  .map(s => (
                    <button
                      key={s}
                      className={`btn w-full ${s===OrderStatus.DELIVERED ? "btn-primary":""}`}
                      onClick={()=>this.updateStatus(s)}
                    >
                      {s}
                    </button>
                ))}
              </div>
              <button onClick={()=>this.setState({ modal:false })} className="btn w-full mt-3">Cerrar</button>
            </div>
          </div>
        )}
      </section>
    );
  }
}

export default withParams(OrderDetail);
