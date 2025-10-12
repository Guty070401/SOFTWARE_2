import { Link, useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";

export default function Cart(){
  const cart = useOrderStore(s => s.cart);
  const removeFromCart = useOrderStore(s => s.removeFromCart);
  const navigate = useNavigate();

  const total = cart.reduce((acc, i) => acc + i.price * (i.qty ?? 1), 0);

  return (
    <section className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="card">
          <h1 className="text-xl font-semibold mb-4">Carrito</h1>
          {cart.length === 0 ? <p className="text-slate-500">Aún no agregas productos.</p> : (
            <ul className="divide-y">
              {cart.map(i => (
                <li key={i.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-slate-500">S/ {i.price}</p>
                  </div>
                  <button className="text-sm text-rose-600 hover:underline"
                    onClick={() => removeFromCart(i.id)}
                  >Quitar</button>
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
            disabled={!cart.length}
            onClick={() => navigate("/customer/checkout", { state: { total } })}
            className="btn btn-primary w-full mt-4 disabled:opacity-50"
          >Continuar al pago</button>
          <Link className="btn w-full mt-2" to="/customer">Seguir comprando</Link>
        </div>
      </aside>
    </section>
  );
}
