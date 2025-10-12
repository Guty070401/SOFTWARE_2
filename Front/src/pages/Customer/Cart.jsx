import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class Cart extends React.Component {
  state = { cart: [] };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cart) => this.setState({ cart }));
    this.setState({ cart: appState.cart });
  }
  componentWillUnmount() { this.unsub && this.unsub(); }

  remove(id) { appState.removeFromCart(id); }

  total() {
    return this.state.cart.reduce((acc, i) => acc + i.price * (i.qty ?? 1), 0);
  }

  goCheckout(){
    const total = this.total();
    this.props.navigate("/customer/checkout", { state: { total } });
  }

  render() {
    const total = this.total();

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-xl font-semibold mb-4">Carrito</h1>
            {this.state.cart.length === 0 ? (
              <p className="text-slate-500">Aún no agregas productos.</p>
            ) : (
              <ul className="divide-y">
                {this.state.cart.map(i => (
                  <li key={i.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-slate-500">S/ {i.price}</p>
                    </div>
                    <button className="text-sm text-rose-600 hover:underline" onClick={() => this.remove(i.id)}>
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <aside>
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total</span>
              <span className="text-lg font-semibold">S/ {total}</span>
            </div>
            <button
              disabled={!this.state.cart.length}
              onClick={()=>this.goCheckout()}
              className="btn btn-primary w-full mt-4 disabled:opacity-50"
            >
              Continuar al pago
            </button>
            <button className="btn w-full mt-2" onClick={()=>this.props.navigate("/customer")}>
              Seguir comprando
            </button>
          </div>
        </aside>
      </section>
    );
  }
}

export default withNavigate(Cart);
