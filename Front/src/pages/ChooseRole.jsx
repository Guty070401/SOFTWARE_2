import React from "react";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import withNavigate from "../oop/router/withNavigate";

class ChooseRole extends React.Component {
  state = { user: null, updatingRole: null, error: null };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u)=> this.setState({ user: u }));
    this.setState({ user: appState.user });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  async choose(role){
    if (this.state.updatingRole) return;
    this.setState({ updatingRole: role, error: null });
    try {
      await appState.setRole(role);
      this.props.navigate(role === "customer" ? "/customer" : "/courier", { replace: true });
    } catch (error) {
      const message = error?.message || "No se pudo actualizar el rol.";
      this.setState({ error: message, updatingRole: null });
    }
  }

  render(){
    return (
      <section className="grid md:grid-cols-2 gap-6">
        {this.state.error && (
          <div className="md:col-span-2 p-3 rounded bg-rose-100 text-rose-700 text-sm">
            {this.state.error}
          </div>
        )}
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Cliente</h2>
          <p className="text-slate-500 mt-1">Explora el menú, arma tu carrito y sigue tu pedido.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={()=>this.choose("customer")}
            disabled={this.state.updatingRole !== null}
          >
            {this.state.updatingRole === "customer" ? "Cargando..." : "Continuar"}
          </button>
        </div>
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Repartidor</h2>
          <p className="text-slate-500 mt-1">Ve pedidos asignados y actualiza su estado.</p>
          <button
            className="btn mt-4"
            onClick={()=>this.choose("courier")}
            disabled={this.state.updatingRole !== null}
          >
            {this.state.updatingRole === "courier" ? "Cargando..." : "Continuar"}
          </button>
        </div>
      </section>
    );
  }
}

export default withNavigate(ChooseRole);
