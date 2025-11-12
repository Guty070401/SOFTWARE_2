import React from "react";
import { useLocation, Link } from "react-router-dom";
import appState from "../../oop/state/AppState";
import withNavigate from "../../oop/router/withNavigate";

function withLocation(Component){
  return (props)=> <Component {...props} location={useLocation()} />;
}

class Checkout extends React.Component {
  state = { total: 0, paying: false, error: "" };

  componentDidMount(){
    const passed = this.props.location?.state?.total ?? 0;
    const fallback = (appState.cart || []).reduce(
      (a,i)=> a + (Number(i.price||0) * (i.qty ?? 1)), 0
    );
    this.setState({ total: passed || fallback });

    const token = localStorage.getItem("token");
    if (!token) this.props.navigate("/login", { replace: true });
  }

  async pay(e){
    e.preventDefault();
    this.setState({ paying: true, error: "" });

    try {
      const cart = appState.cart || [];
      if (!cart.length) throw new Error("Tu carrito está vacío");

      // Crear la orden en el backend y reflejarla en el estado global
      const order = await appState.placeOrder();

      // Ir al detalle del pedido creado (vista de cliente)
      this.props.navigate(`/customer/order/${order.id}`, { replace: true });

    } catch (err) {
      console.error("[Checkout] create order error:", err);
      this.setState({ error: err?.message || "No se pudo crear la orden" });
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

          <form onSubmit={(e)=>this.pay(e)} className="grid gap-4">

            {/* Datos */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nombre y Apellidos"
                pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+"
                title="Solo letras y espacios"
                required
              />
              <input
                className="input"
                placeholder="Teléfono"
                inputMode="numeric"
                maxLength={9}
                pattern="9[0-9]{8}"
                title="Teléfono de 9 dígitos que empieza con 9"
                required
              />
            </div>

            <input
              className="input"
              placeholder="Dirección exacta de entrega"
              pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ]+"
              title="Solo letras, números y espacios"
              required
            />

            {/* Tarjeta */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nro. tarjeta (XXXX-XXXX-XXXX-XXXX)"
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
                pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
                title="Formato XXXX-XXXX-XXXX-XXXX"
                onInput={(e)=>{
                  const digits = (e.target.value || "").replace(/\D/g, "").slice(0,16);
                  e.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1-");
                }}
                required
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  className="input"
                  placeholder="MM"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  maxLength={2}
                  pattern="(0[1-9]|1[0-2])"
                  title="Mes (01-12)"
                  required
                />
                <input
                  className="input"
                  placeholder="AA"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  maxLength={2}
                  pattern="[0-9]{2}"
                  title="Año (AA)"
                  required
                />
                <input
                  className="input"
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={3}
                  pattern="[0-9]{3}"
                  title="CVV de 3 dígitos"
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

            {this.state.error && (
              <div className="text-red-600 text-sm">{this.state.error}</div>
            )}

            <button className="btn btn-primary" disabled={this.state.paying}>
              {this.state.paying ? "Procesando..." : "Pagar y crear pedido"}
            </button>

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
