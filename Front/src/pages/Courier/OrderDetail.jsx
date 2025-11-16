import React from "react";
import { useParams, Link } from "react-router-dom";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus, { statusLabel } from "../../oop/models/OrderStatus";
import OrderChatPanel from "../../components/OrderChatPanel";

function withParams(Component){
  return (props)=> <Component {...props} params={useParams()} />;
}

export class OrderDetail extends React.Component {
  state = { order: null, notFound: false, modal: false };

  componentDidMount(){
    this.load();
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, ()=> this.load());
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  load() {
    const { id } = this.props.params;
    const o = appState.orders.find(x => String(x.id) === String(id));
    this.setState({ order: o || null, notFound: !o });
  }

  async updateStatus(s){
    if (!this.state.order) return;
    await appState.updateStatus(this.state.order.id, s);
    this.setState({ modal:false });
  }

  render(){
    if (this.state.notFound) return <div className="card">Pedido no encontrado.</div>;
    const o = this.state.order;
    if (!o) return null;

    const userRole = appState.user?.role;
    const isCourier = userRole === "courier";

    // 🔹 destino y texto dinámicos
    const backTo = isCourier ? "/courier" : "/customer/orders";
    const backLabel = isCourier
      ? " Volver a pedidos asignados"
      : " Volver a pedidos realizados";

    const customerName = o.customerName || o.customer?.name || o.user?.name || null;

    const statusFlow = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKED,
      OrderStatus.ON_ROUTE,
      OrderStatus.CANCELED,
      OrderStatus.DELIVERED,
    ];
    const currentStatusKey = String(o.status || '').toLowerCase();
    const currentIndex = statusFlow.indexOf(currentStatusKey);
    const nextStatus = currentIndex >= 0 ? statusFlow[currentIndex + 1] ?? null : null;
    const paymentSummary =
      o.paymentSummary ||
      o.paymentDetails?.publicSummary ||
      o.paymentDetails?.userSummary ||
      (typeof o.comentarios === "string" ? o.comentarios : "") ||
      (typeof o.comentario === "string" ? o.comentario : "");

    // 🔹 label e indicador de entregado (mismo estilo que en CustomerOrders)
    const statusText = statusLabel(o.status);
    const statusNorm = String(statusText || o.status || "").toLowerCase();
    const isDelivered =
      statusNorm.includes("entregado") || statusNorm.includes("delivered");

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-xl font-semibold">Pedido #{o.id}</h1>
            {customerName && (
              <p className="text-sm text-slate-500 mt-1">Cliente: {customerName}</p>
            )}
            {Array.isArray(o.items) && o.items.length ? (
              <ul className="mt-3 space-y-2">
                {o.items.map((it, idx) => {
                  const name = it.name || `Producto ${it.productoId || it.id}`;
                  const qty = Number(it.qty ?? it.cantidad ?? 1);
                  const price = Number(it.price ?? it.precio ?? 0);
                  const lineTotal = (qty * price).toFixed(2);
                  return (
                    <li key={it.id ?? idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {it.image && (
                          <img src={it.image} alt={name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <span className="text-slate-700">
                          {name} x{qty}
                        </span>
                      </div>
                      <span className="text-slate-500">S/ {lineTotal}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500 mt-3">No hay ítems para mostrar.</p>
            )}
          </div>
        </div>

        <aside>
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado</span>

              {/* 🔹 Badge con check verde en una sola línea si está entregado */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize inline-flex items-center gap-1
                  ${
                    isDelivered
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }
                `}
              >
                {isDelivered && <span className="text-base leading-none">✓</span>}
                {isDelivered ? "Entregado" : statusText}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-slate-500">Total</span>
              {(() => {
                const computed =
                  o.total != null
                    ? Number(o.total)
                    : Array.isArray(o.items)
                    ? o.items.reduce(
                        (a, it) =>
                          a +
                          Number(it.price ?? it.precio ?? 0) *
                            Number(it.qty ?? it.cantidad ?? 1),
                        0
                      )
                    : 0;
                return <span className="font-semibold">S/ {computed.toFixed(2)}</span>;
              })()}
            </div>

            {/* 🔹 Botón dinámico de volver */}
            <div className="mt-4">
              <Link
                to={backTo}
                className="btn w-full border border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                {backLabel}
              </Link>
            </div>

            {paymentSummary && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Pago</p>
                <p className="text-sm text-slate-700">{paymentSummary}</p>
              </div>
            )}

            {/* Solo el repartidor puede actualizar estado */}
            {isCourier && (
              <button
                onClick={()=>this.setState({ modal:true })}
                className="btn btn-primary w-full mt-4"
                disabled={!nextStatus}
              >
                {nextStatus ? `Cambiar a: ${statusLabel(nextStatus)}` : "Sin acciones disponibles"}
              </button>
            )}
          </div>
        </aside>

        {/* Modal visible solo si es courier */}
        {isCourier && this.state.modal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="card relative w-full max-w-sm">
              <button
                aria-label="Cerrar"
                onClick={()=>this.setState({ modal:false })}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
              <h3 className="text-lg font-semibold mb-4">Actualizar Estado</h3>
              <div className="grid gap-2">
                {nextStatus ? (
                  <button
                    className="btn btn-primary w-full"
                    onClick={()=>this.updateStatus(nextStatus)}
                  >
                    {`Cambiar a: ${statusLabel(nextStatus)}`}
                  </button>
                ) : (
                  <span className="text-center text-slate-500">
                    No hay transiciones disponibles
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-3">
          <OrderChatPanel orderId={o.id} />
        </div>
      </section>
    );
  }
}

export default withParams(OrderDetail);
