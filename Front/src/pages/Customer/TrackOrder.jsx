import { Link } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";

const stepStyle = (active) =>
  `flex-1 h-2 rounded-full ${active ? "bg-indigo-600" : "bg-slate-200"}`;

export default function TrackOrder(){
  const orders = useOrderStore(s => s.orders);
  const last = orders[orders.length - 1];

  const steps = ["pending","accepted","picked","on_route","delivered"];
  const idx = last ? steps.indexOf(last.status) : -1;

  return (
    <section className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Seguimiento de pedido</h1>
        {!last ? (
          <p className="text-slate-500">No hay pedidos. <Link className="text-indigo-600" to="/customer">Ir al menú</Link></p>
        ) : (
          <>
            <div className="flex items-center gap-2 my-4">
              {steps.map((_, i) => <div key={i} className={stepStyle(i <= idx)} />)}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="card">
                <p className="text-slate-500 mb-1">Estado</p>
                <p className="font-semibold capitalize">{last.status}</p>
              </div>
              <div className="card">
                <p className="text-slate-500 mb-1">Total</p>
                <p className="font-semibold">S/ {last.total}</p>
              </div>
            </div>
            <p className="text-slate-500 mt-4">Ref: #{last.id}</p>
          </>
        )}
      </div>
    </section>
  );
}
