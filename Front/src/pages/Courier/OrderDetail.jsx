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
  state = { order: null, notFound: false, modal: false, loading: false, error: null };

  componentDidMount(){
    this._mounted = true;
    this.load();
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, ()=> this.load());
  }
  componentWillUnmount(){
    this.unsub && this.unsub();
    this._mounted = false;
  }

  async load() {
    const { id } = this.props.params;
    if (!id) {
      this.setState({ order: null, notFound: true });
      return;
    }
    if (!this._mounted) return;
    this.setState({ loading: true, error: null });
    try {
      let order = appState.orders.find(x => String(x.id) === String(id));
      if (!order) {
        order = await appState.getOrder(id);
      }
      if (!this._mounted) return;
      this.setState({ order: order || null, notFound: !order, loading: false });
    } catch (error) {
      if (!this._mounted) return;
      this.setState({ order: null, notFound: true, loading: false, error: error?.message || 'No se pudo cargar el pedido.' });
    }
  }

  async updateStatus(s){
    if (!this.state.order) return;
    try {
      await appState.updateStatus(this.state.order.id, s);
      this.setState({ modal:false, error: null });
      await this.load();
    } catch (error) {
      this.setState({ modal:false, error: error?.message || 'No se pudo actualizar el estado.' });
    }
  }

  render(){
    if (this.state.notFound) return <div className="card">Pedido no encontrado.</div>;
    if (this.state.loading && !this.state.order) {
      return (
        <section className="max-w-2xl mx-auto">
          <div className="card">Cargando pedido...</div>
        </section>
      );
    }
    const o = this.state.order;
    if (!o) return null;

    // Obtenemos el rol actual del usuario
    const userRole = appState.user?.role;

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        {this.state.error && (
          <div className="lg:col-span-3">
            <div className="card bg-rose-100 text-rose-700">{this.state.error}</div>
          </div>
        )}
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
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold">S/ {o.total}</span>
            </div>

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
