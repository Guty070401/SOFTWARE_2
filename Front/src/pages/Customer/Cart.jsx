import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class Cart extends React.Component {
  state = { cart: [] };

  componentDidMount() {
    this.unsubCart = appState.on(EVENTS.CART_CHANGED, (cart) => this.setState({ cart }));
    this.setState({ cart: appState.cart });
  }

  componentWillUnmount() {
    this.unsubCart && this.unsubCart();
  }

  getGroupedCart() {
    const grouped = new Map();
    for (const item of this.state.cart) {
      const entry = grouped.get(item.id) || { ...item, qty: 0 };
      entry.qty += item.qty ?? 1;
      grouped.set(item.id, entry);
    }
    return Array.from(grouped.values());
  }

  removeOne(id) {
    const found = this.state.cart.find((i) => i.id === id);
    if (found) {
      appState.removeFromCart(found.cartId);
    }
  }

  total() {
    return this.state.cart.reduce((acc, i) => acc + Number(i.price ?? 0), 0);
  }

  goCheckout() {
    const total = this.total();
    this.props.navigate("/customer/checkout", { state: { total } });
  }

  render() {
    const groupedCart = this.getGroupedCart();
    const total = this.total();

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-xl font-semibold mb-4">Carrito</h1>

            {groupedCart.length === 0 ? (
              <p className="text-slate-500">Aún no agregas productos.</p>
            ) : (
              <ul className="divide-y">
                {groupedCart.map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {i.qty} × {i.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Precio unitario: S/ {Number(i.price ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="text-sm text-rose-600 hover:underline"
                      onClick={() => this.removeOne(i.id)}
                    >
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
              <span className="text-lg font-semibold">S/ {total.toFixed(2)}</span>
            </div>

            <button
              disabled={!this.state.cart.length}
              onClick={() => this.goCheckout()}
              className="btn btn-primary w-full mt-4 disabled:opacity-50"
            >
              Continuar al pago
            </button>

            <button
              className="btn w-full mt-2"
              onClick={() => this.props.navigate("/customer")}
            >
              Seguir comprando
            </button>

            {this.state.cart.length > 0 && (
              <button
                className="btn w-full mt-2"
                onClick={() => appState.clearCart()}
              >
                Vaciar carrito
              </button>
            )}
          </div>
        </aside>
      </section>
    );
  }
}

export default withNavigate(Cart);
