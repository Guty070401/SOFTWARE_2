import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus from "../../oop/models/OrderStatus";
import withNavigate from "../../oop/router/withNavigate";

class TrackOrder extends React.Component {
  state = { last: null };

  static STEPS = [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PICKED, OrderStatus.ON_ROUTE, OrderStatus.DELIVERED];

  componentDidMount(){
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders)=> this.setState({ last: orders[orders.length-1] || null }));
    this.setState({ last: appState.orders[appState.orders.length-1] || null });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  renderBar(){
    const { last } = this.state;
    const idx = last ? TrackOrder.STEPS.indexOf(last.status) : -1;
    return (
      <div className="flex items-center gap-2 my-4">
        {TrackOrder.STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full ${i <= idx ? "bg-indigo-600" : "bg-slate-200"}`} />
        ))}
      </div>
    );
  }

  render(){
    const { last } = this.state;
    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Seguimiento de pedido</h1>
          {!last ? (
            <div>
              <p className="text-slate-500 mb-3">No hay pedidos.</p>
              <button className="btn btn-primary" onClick={()=>this.props.navigate("/customer")}>Ir al menú</button>
            </div>
          ) : (
            <>
              {this.renderBar()}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="card">
                  <p className="text-slate-500 mb-1">Estado</p>
                  <p className="font-semibold capitalize">{last.status}</p>
                </div>
                <div className="card">
                  <p className="text-slate-500 mb-1">Total</p>
                  <p className="font-semibold">S/ {last.total}</p>
                </div>
              </div>
              <p className="text-slate-500 mt-4">Ref: #{last.id}</p>

              <div className="mt-6">
                <button className="btn" onClick={()=>this.props.navigate("/customer")}>
                  Regresar a la Tienda
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }
}

export default withNavigate(TrackOrder);
