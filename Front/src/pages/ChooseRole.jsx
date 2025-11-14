import React from "react";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import withNavigate from "../oop/router/withNavigate";

export class ChooseRole extends React.Component {
  state = { user: null };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u)=> this.setState({ user: u }));
    this.setState({ user: appState.user });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  choose(role){
    appState.setRole(role);
    this.props.navigate(role === "customer" ? "/customer" : "/courier", { replace: true });
  }

  render(){
    return (
      <section className="grid md:grid-cols-2 gap-6">
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Cliente</h2>
          <p className="text-slate-500 mt-1">Explora el menú, arma tu carrito y sigue tu pedido.</p>
          <button className="btn btn-primary mt-4" onClick={()=>this.choose("customer")}>Continuar</button>
        </div>
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Repartidor</h2>
          <p className="text-slate-500 mt-1">Ve pedidos asignados y actualiza su estado.</p>
          <button className="btn mt-4" onClick={()=>this.choose("courier")}>Continuar</button>
        </div>
      </section>
    );
  }
}

export default withNavigate(ChooseRole);
