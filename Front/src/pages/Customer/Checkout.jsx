import React from "react";
import { useLocation } from "react-router-dom";
import appState from "../../oop/state/AppState";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component){
  return (props)=> <Component {...props} location={useLocation()} />;
}

class Checkout extends React.Component {
  state = { total: 0, paying: false, address: "", notes: "", error: null };

  componentDidMount(){
    const passed = this.props.location?.state?.total ?? 0;
    const fallback = appState.cart.reduce((a,i)=>a+i.price*(i.qty??1),0);
    this.setState({ total: passed || fallback });
  }

  async pay(e){
    e.preventDefault();
    this.setState({ paying: true, error: null });
    try {
      await appState.placeOrder({ address: this.state.address, notes: this.state.notes });
      this.setState({ paying: false });
      this.props.navigate("/customer/track", { replace: true });
    } catch (error) {
      const message = error?.message || "No se pudo procesar el pedido.";
      this.setState({ paying: false, error: message });
    }
  }

  render(){
    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Checkout</h1>
          <p className="text-slate-500 mb-4">Completa tus datos para confirmar.</p>
          <form onSubmit={(e)=>this.pay(e)} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input" placeholder="Nombre y Apellidos" required/>
              <input className="input" placeholder="Teléfono" />
            </div>
            <input
              className="input"
              placeholder="Dirección exacta de entrega"
              value={this.state.address}
              onChange={(e)=>this.setState({ address: e.target.value })}
              required
            />
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input" placeholder="Nro. tarjeta" required/>
              <input className="input" placeholder="MM/AA - CVV" required/>
            </div>
            <textarea
              className="input"
              placeholder="Notas para el pedido (opcional)"
              rows={3}
              value={this.state.notes}
              onChange={(e)=>this.setState({ notes: e.target.value })}
            />
            {this.state.error && (
              <p className="text-sm text-rose-600">{this.state.error}</p>
            )}
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
