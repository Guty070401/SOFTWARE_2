import React from "react";
import { useParams, Link } from "react-router-dom";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus from "../../oop/models/OrderStatus";

function withParams(Component){
  return (props)=> <Component {...props} params={useParams()} />;
}

class OrderDetail extends React.Component {
  state = { order: null, notFound: false, modal: false };

  componentDidMount(){
    this.load();
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, ()=> this.load());
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  load() {
    const { id } = this.props.params;
    const o = appState.orders.find(x => String(x.id) === String(id));
    this.setState({ order: o || null, notFound: !o });
  }

  async updateStatus(s){
    if (!this.state.order) return;
    await appState.updateStatus(this.state.order.id, s);
    this.setState({ modal:false });
  }

  render(){
    if (this.state.notFound) return <div className="card">Pedido no encontrado.</div>;
    const o = this.state.order;
    if (!o) return null;

    const userRole = appState.user?.role;
    const isCourier = userRole === "courier";

    // 🔹 destino y texto dinámicos
    const backTo = isCourier ? "/courier" : "/customer/orders";
    const backLabel = isCourier
      ? " Volver a pedidos asignados"
      : " Volver a pedidos realizados";

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
            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold">S/ {Number(o.total).toFixed(2)}</span>
            </div>

            {/* 🔹 Botón dinámico de volver */}
            <div className="mt-4">
              <Link
                to={backTo}
                className="btn w-full border border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                {backLabel}
              </Link>
            </div>

            {/* Solo el repartidor puede actualizar estado */}
            {isCourier && (
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
        {isCourier && this.state.modal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="card w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-2">Actualizar Estado</h3>
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
