import React from "react";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import withNavigate from "../oop/router/withNavigate";

class ChooseRole extends React.Component {
  state = { user: null, loadingRole: null, error: null };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) => this.setState({ user: u }));
    this.setState({ user: appState.user });
    if (!appState.user) {
      appState.bootstrap?.();
    }
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  async choose(role) {
    this.setState({ loadingRole: role, error: null });
    try {
      await appState.setRole(role);
      this.props.navigate(role === "customer" ? "/customer" : "/courier", { replace: true });
    } catch (error) {
      this.setState({ error: error.message || "No se pudo actualizar el rol", loadingRole: null });
    }
  }

  render() {
    const { user, loadingRole, error } = this.state;
    if (!user) {
      return (
        <section className="card">
          <p className="text-slate-500">Inicia sesión para elegir un rol.</p>
        </section>
      );
    }

    return (
      <section className="grid md:grid-cols-2 gap-6">
        {error && (
          <div className="md:col-span-2">
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2">
              {error}
            </div>
          </div>
        )}
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Cliente</h2>
          <p className="text-slate-500 mt-1">Explora el menú, arma tu carrito y sigue tu pedido.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => this.choose("customer")}
            disabled={loadingRole === "customer"}
          >
            {loadingRole === "customer" ? "Cargando..." : "Continuar"}
          </button>
        </div>
        <div className="card flex flex-col items-start">
          <h2 className="text-xl font-semibold">Soy Repartidor</h2>
          <p className="text-slate-500 mt-1">Ve pedidos asignados y actualiza su estado.</p>
          <button
            className="btn mt-4"
            onClick={() => this.choose("courier")}
            disabled={loadingRole === "courier"}
          >
            {loadingRole === "courier" ? "Cargando..." : "Continuar"}
          </button>
        </div>
      </section>
    );
  }
}

export default withNavigate(ChooseRole);
