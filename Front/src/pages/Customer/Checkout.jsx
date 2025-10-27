import React from "react";
import { useLocation } from "react-router-dom";
import appState from "../../oop/state/AppState";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component) {
  return (props) => <Component {...props} location={useLocation()} />;
}

class Checkout extends React.Component {
  state = {
    total: 0,
    paying: false,
    name: "",
    phone: "",
    address: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    notes: "",
    error: null,
  };

  componentDidMount() {
    if (!appState.user) {
      this.props.navigate("/", { replace: true });
      return;
    }
    const passed = this.props.location?.state?.total ?? 0;
    const fallback = appState.cart.reduce((a, i) => a + Number(i.price ?? 0), 0);
    this.setState({ total: passed || fallback });
  }

  async pay(e) {
    e.preventDefault();
    if (!this.state.address.trim()) {
      this.setState({ error: "Ingresa una dirección de entrega" });
      return;
    }

    this.setState({ paying: true, error: null });
    try {
      await appState.placeOrder({
        address: this.state.address,
        notes: this.state.notes,
      });
    } catch (error) {
      this.setState({ error: error.message || "No se pudo crear el pedido", paying: false });
      return;
    }

    this.props.navigate("/customer/track", { replace: true });
  }

  render() {
    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Checkout</h1>
          <p className="text-slate-500 mb-4">Completa tus datos para confirmar.</p>
          <form onSubmit={(e) => this.pay(e)} className="grid gap-4">
            {this.state.error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2">
                {this.state.error}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nombre y Apellidos"
                value={this.state.name}
                onChange={(e) => this.setState({ name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Teléfono"
                value={this.state.phone}
                onChange={(e) => this.setState({ phone: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Dirección exacta de entrega"
              value={this.state.address}
              onChange={(e) => this.setState({ address: e.target.value })}
              required
            />
            <textarea
              className="input"
              placeholder="Indicaciones para el repartidor (opcional)"
              value={this.state.notes}
              onChange={(e) => this.setState({ notes: e.target.value })}
              rows={3}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nro. tarjeta"
                value={this.state.cardNumber}
                onChange={(e) => this.setState({ cardNumber: e.target.value })}
              />
              <input
                className="input"
                placeholder="MM/AA - CVV"
                value={this.state.cardExpiry}
                onChange={(e) => this.setState({ cardExpiry: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total a pagar</span>
              <span className="text-xl font-semibold">S/ {Number(this.state.total).toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" disabled={this.state.paying}>
              {this.state.paying ? "Procesando..." : "Pagar y crear pedido"}
            </button>
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(withLocation(Checkout));
