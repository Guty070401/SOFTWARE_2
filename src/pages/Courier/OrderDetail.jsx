import { useParams } from "react-router-dom";
import { useState } from "react";
import { useOrderStore } from "../../store/useOrderStore";
import StatusModal from "../../components/StatusModal";

export default function OrderDetail(){
  const { id } = useParams();
  const order = useOrderStore(s => s.orders.find(o => o.id === id));
  const updateStatus = useOrderStore(s => s.updateStatus);
  const [open, setOpen] = useState(false);

  if (!order) return <div className="card">Pedido no encontrado.</div>;

  return (
    <section className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="card">
          <h1 className="text-xl font-semibold">Pedido #{order.id}</h1>
          <ul className="mt-3 space-y-2">
            {order.items.map(it => (
              <li key={it.id} className="flex items-center justify-between">
                <span className="text-slate-700">{it.name}</span>
                <span className="text-slate-500">S/ {it.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside>
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Estado</span>
            <span className="pill capitalize">{order.status}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold">S/ {order.total}</span>
          </div>
          <button onClick={() => setOpen(true)} className="btn btn-primary w-full mt-4">
            Actualizar estado
          </button>
        </div>
      </aside>

      <StatusModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(s) => updateStatus(order.id, s)}
      />
    </section>
  );
}
