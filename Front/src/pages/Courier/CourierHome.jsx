import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class CourierHome extends React.Component {
  state = { orders: [] };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, (orders)=> this.setState({ orders }));
    this.setState({ orders: appState.orders });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  openOrder(id){ this.props.navigate(`/courier/order/${id}`); }

  render(){
    const { orders } = this.state;
    return (
      <section>
        <h1 className="text-2xl font-semibold mb-4">Pedidos asignados</h1>
        {!orders.length ? (
          <div className="card">
            <p className="text-slate-500">No hay pedidos aún. (Crea uno desde Cliente)</p>
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
                  <span className="pill capitalize">{o.status}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">{o.items.length} ítems</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">S/ {o.total}</span>
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
