import { Link } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";

export default function CourierHome(){
  const orders = useOrderStore(s => s.orders);

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Pedidos asignados</h1>
      {!orders.length ? (
        <div className="card">
          <p className="text-slate-500">No hay pedidos aún. (Crea uno desde Cliente)</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(o => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pedido</p>
                  <p className="font-semibold">#{o.id}</p>
                </div>
                <span className="pill capitalize">{o.status}</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">{o.items.length} ítems</p>
              <div className="flex items-center justify-between mt-4">
                <span className="font-semibold">S/ {o.total}</span>
                <Link className="btn btn-primary" to={`/courier/order/${o.id}`}>Ver detalle</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
