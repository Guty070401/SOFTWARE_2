import React from "react";
import { useLocation } from "react-router-dom";
import appState from "../../oop/state/AppState";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component){
  return (props)=> <Component {...props} location={useLocation()} />;
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
    error: null,
    storeId: null
  };

  componentDidMount(){
    if (!appState.cart.length) {
      this.props.navigate("/customer/cart", { replace: true });
      return;
    }
    const passed = this.props.location?.state?.total ?? 0;
    const fallback = appState.cart.reduce((a,i)=>a+Number(i.price || 0)*(i.qty??1),0);
    const total = Number(passed) || fallback;
    const storeId = this.props.location?.state?.storeId ?? (appState.cart.find((item) => item.storeId)?.storeId || null);
    this.setState({ total, storeId });
  }

  async pay(e){
    e.preventDefault();
    if (this.state.paying) return;
    this.setState({ paying: true, error: null });
    try {
      if (!this.state.storeId) {
        throw new Error('No se pudo determinar la tienda del pedido.');
      }
      await appState.placeOrder({
        storeId: this.state.storeId,
        address: this.state.address,
        notes: this.state.phone ? `Contacto: ${this.state.phone}` : undefined
      });
      this.props.navigate("/customer/track", { replace: true });
    } catch (error) {
      const message = error?.message || 'No se pudo procesar el pago.';
      this.setState({ error: message });
    } finally {
      this.setState({ paying: false });
    }
  }

  render(){
    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Checkout</h1>
          <p className="text-slate-500 mb-4">Completa tus datos para confirmar.</p>
          {this.state.error && (
            <div className="p-3 mb-3 rounded bg-rose-100 text-rose-700 text-sm">
              {this.state.error}
            </div>
          )}
          <form onSubmit={(e)=>this.pay(e)} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nombre y Apellidos"
                value={this.state.name}
                onChange={(e)=>this.setState({ name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Teléfono"
                value={this.state.phone}
                onChange={(e)=>this.setState({ phone: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Dirección exacta de entrega"
              value={this.state.address}
              onChange={(e)=>this.setState({ address: e.target.value })}
              required
            />
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nro. tarjeta"
                value={this.state.cardNumber}
                onChange={(e)=>this.setState({ cardNumber: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="MM/AA - CVV"
                value={this.state.cardExpiry}
                onChange={(e)=>this.setState({ cardExpiry: e.target.value })}
                required
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
