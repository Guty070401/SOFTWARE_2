import React from "react";
import { useLocation, Link } from "react-router-dom";
import appState from "../../oop/state/AppState";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component){
  return (props)=> <Component {...props} location={useLocation()} />;
}

class Checkout extends React.Component {
  state = { total: 0, paying: false };

  componentDidMount(){
    const passed = this.props.location?.state?.total ?? 0;
    const fallback = appState.cart.reduce((a,i)=>a + i.price * (i.qty ?? 1), 0);
    this.setState({ total: passed || fallback });
  }

  async pay(e){
    e.preventDefault();
    this.setState({ paying: true });
    await appState.placeOrder();
    this.setState({ paying: false });
    this.props.navigate("/customer/track", { replace: true });
  }

  render(){
    return (
      <section className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-xl font-semibold mb-2">Checkout</h1>
          <p className="text-slate-500 mb-4">Completa tus datos para confirmar.</p>

          <form onSubmit={(e)=>this.pay(e)} className="grid gap-4">
            {/* Datos */}
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input" placeholder="Nombre y Apellidos" required />
              <input className="input" placeholder="Teléfono" inputMode="numeric" />
            </div>

            <input className="input" placeholder="Dirección exacta de entrega" required />

            {/* Tarjeta */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nro. tarjeta"
                inputMode="numeric"
                autoComplete="cc-number"
                required
              />

              {/* MM / AA / CVV separados */}
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="input"
                  placeholder="MM"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  maxLength={2}
                  pattern="\d{2}"
                  title="Mes (MM)"
                  required
                />
                <input
                  className="input"
                  placeholder="AA"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  maxLength={2}
                  pattern="\d{2}"
                  title="Año (AA)"
                  required
                />
                <input
                  className="input"
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  pattern="\d{3,4}"
                  title="CVV de 3 o 4 dígitos"
                  required
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total a pagar</span>
              <span className="text-xl font-semibold">
                S/ {Number(this.state.total || 0).toFixed(2)}
              </span>
            </div>

            {/* Botón principal */}
            <button className="btn btn-primary" disabled={this.state.paying}>
              {this.state.paying ? "Procesando..." : "Pagar y crear pedido"}
            </button>

            {/* 🔹 Botón volver al carrito */}
            <Link
              to="/customer/cart"
              className="btn w-full border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              Volver al carrito
            </Link>
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(withLocation(Checkout));
