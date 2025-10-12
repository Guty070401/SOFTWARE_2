import { useLocation, useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";

export default function Checkout(){
  const { state } = useLocation();
  const total = state?.total ?? 0;
  const placeOrder = useOrderStore(s => s.placeOrder);
  const navigate = useNavigate();

  function pay(e){
    e.preventDefault();
    placeOrder(total);
    navigate("/customer/track");
  }

  return (
    <section className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Checkout</h1>
        <p className="text-slate-500 mb-4">Completa tus datos para confirmar.</p>
        <form onSubmit={pay} className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input" placeholder="Nombre y Apellidos" required/>
            <input className="input" placeholder="Teléfono" />
          </div>
          <input className="input" placeholder="Lugar de entrega" required/>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input" placeholder="Nro. tarjeta" required/>
            <input className="input" placeholder="MM/AA - CVV" required/>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Total a pagar</span>
            <span className="text-xl font-semibold">S/ {total}</span>
          </div>
          <button className="btn btn-primary">Pagar y crear pedido</button>
        </form>
      </div>
    </section>
  );
}
