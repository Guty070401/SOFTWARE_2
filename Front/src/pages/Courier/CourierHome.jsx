import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";
import { statusLabel } from "../../oop/models/OrderStatus";

class CourierHome extends React.Component {
  state = { orders: [] };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders)=> this.setState({ orders }));
    if (typeof appState.fetchOrders === "function") appState.fetchOrders();
    this.setState({ orders: appState.orders });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  openOrder(id){ this.props.navigate(`/courier/order/${id}`); }

  render(){
    const { orders } = this.state;
    return (
      <section>
        <h1 className="text-2xl font-semibold mb-4">Pedidos Asignados</h1>
        {!orders.length ? (
          <div className="card">
            <p className="text-slate-500">No hay pedidos a√∫n. (Crea uno desde Cliente)</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(o => (
              <div key={o.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Pedido</p>
                    <p className="font-semibold">#{o.id}</p>
                  </div>
                  <span className="pill">{statusLabel(o.status)}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">{Array.isArray(o.items) ? o.items.length : 0} Ìtems</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">S/ {Number(o.total ?? 0).toFixed(2)}</span>
                  <button className="btn btn-primary" onClick={()=>this.openOrder(o.id)}>Ver detalle</button>
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



