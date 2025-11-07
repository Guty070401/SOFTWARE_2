import React from "react";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import withNavigate from "../oop/router/withNavigate";

class ChooseRole extends React.Component {
  state = { user: null, loadingRole: null, error: null };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u)=> this.setState({ user: u }));
    this.setState({ user: appState.user });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  async choose(role){
    this.setState({ loadingRole: role, error: null });
    try {
      await appState.setRole(role);
      this.props.navigate(role === "customer" ? "/customer" : "/courier", { replace: true });
    } catch (error) {
      const message = error?.message || "No se pudo actualizar el rol.";
      this.setState({ error: message, loadingRole: null });
    }
  }

  render(){
    return (
      <section className="grid md:grid-cols-2 gap-6">
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Cliente</h2>
          <p className="text-slate-500 mt-1">Explora el menú, arma tu carrito y sigue tu pedido.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={()=>this.choose("customer")}
            disabled={this.state.loadingRole === "customer"}
          >
            {this.state.loadingRole === "customer" ? "Guardando..." : "Continuar"}
          </button>
        </div>
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Repartidor</h2>
          <p className="text-slate-500 mt-1">Ve pedidos asignados y actualiza su estado.</p>
          <button
            className="btn mt-4"
            onClick={()=>this.choose("courier")}
            disabled={this.state.loadingRole === "courier"}
          >
            {this.state.loadingRole === "courier" ? "Guardando..." : "Continuar"}
          </button>
        </div>
        {this.state.error && (
          <p className="text-sm text-rose-600">{this.state.error}</p>
        )}
      </section>
    );
  }
}

export default withNavigate(ChooseRole);
