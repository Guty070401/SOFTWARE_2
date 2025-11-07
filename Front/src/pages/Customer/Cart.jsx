import React from "react";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import withNavigate from "../../oop/router/withNavigate";

class Cart extends React.Component {
  state = { cart: [] };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cart) =>
      this.setState({ cart })
    );
    this.setState({ cart: appState.cart });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  // 🔹 Agrupa productos iguales por id
  getGroupedCart() {
    const grouped = {};
    for (const item of this.state.cart) {
      const key = `${item.storeId ?? 'unknown'}::${item.id}`;
      if (!grouped[key]) {
        grouped[key] = { ...item, qty: 1, cartIds: [item.cartId] };
      } else {
        grouped[key].qty += 1;
        grouped[key].cartIds.push(item.cartId);
      }
    }
    return Object.values(grouped);
  }

  // 🔹 Quita una unidad del producto
  removeOne(group) {
    const cartId = group.cartIds?.[0];
    if (!cartId) return;
    appState.removeFromCart(cartId);
  }

  total() {
    return this.state.cart.reduce((acc, i) => acc + Number(i.price || 0), 0);
  }

  goCheckout() {
    const total = this.total();
    const storeId = this.state.cart.find((i) => i.storeId)?.storeId || null;
    this.props.navigate("/customer/checkout", { state: { total, storeId } });
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
                  <li key={`${i.storeId ?? 'store'}-${i.id}`} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {i.qty} × {i.name}
                      </p>
                      {i.storeName && (
                        <p className="text-xs text-slate-400">{i.storeName}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Precio unitario: S/ {Number(i.price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="text-sm text-rose-600 hover:underline"
                      onClick={() => this.removeOne(i)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 🔹 Total y botones */}
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
          </div>
        </aside>
      </section>
    );
  }
}

export default withNavigate(Cart);
