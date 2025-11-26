// Front/src/pages/Customer/TrackOrder.jsx (OrderDetail)
import React from "react";
import { useParams, Link } from "react-router-dom";
import appState from "../../oop/state/AppState";
import { EVENTS } from "../../oop/state/events";
import OrderStatus, { statusLabel } from "../../oop/models/OrderStatus";
import OrderChatPanel from "../../components/OrderChatPanel";

function withParams(Component) {
  return (props) => <Component {...props} params={useParams()} />;
}

export class OrderDetail extends React.Component {
  state = { order: null, notFound: false, modal: false };

  componentDidMount() {
    this.load();
    this.unsub = appState.on(EVENTS.ORDERS_CHANGED, () => this.load());
  }
  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  load() {
    const { id } = this.props.params;
    const o = appState.orders.find((x) => String(x.id) === String(id));
    this.setState({ order: o || null, notFound: !o });
  }

  async updateStatus(status) {
    if (!this.state.order) return;
    try {
      await appState.updateStatus(this.state.order.id, status);
      this.setState({ modal: false });
    } catch (e) {
      alert(e?.message || "No se pudo actualizar el estado");
    }
  }

  async cancelOrderAsCustomer() {
    if (!this.state.order) return;
    if (!window.confirm("¿Seguro que deseas cancelar este pedido?")) return;
    try {
      await appState.cancelOrder(this.state.order.id);
    } catch (e) {
      alert(e?.message || "No se pudo cancelar el pedido");
    }
  }

  render() {
    if (this.state.notFound)
      return <div className="card">Pedido no encontrado.</div>;
    const o = this.state.order;
    if (!o) return null;

    const userRole = appState.user?.role;
    const isCourier = userRole === "courier";
    const isCustomer = userRole === "customer";

    const backTo = isCourier ? "/courier" : "/customer/orders";
    const backLabel = isCourier
      ? "Volver a pedidos asignados"
      : "Volver a pedidos realizados";

    const customerName =
      o.customerName || o.customer?.name || o.user?.name || null;

    const statusFlow = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKED,
      OrderStatus.ON_ROUTE,
      OrderStatus.DELIVERED,
    ];

    const currentStatusKey = String(o.status || "").toLowerCase();
    const currentIndex = statusFlow.indexOf(currentStatusKey);
    const nextStatus =
      currentIndex >= 0 ? statusFlow[currentIndex + 1] ?? null : null;

    const paymentSummary =
      o.paymentSummary ||
      o.paymentDetails?.publicSummary ||
      o.paymentDetails?.userSummary ||
      (typeof o.comentarios === "string" ? o.comentarios : "") ||
      (typeof o.comentario === "string" ? o.comentario : "");

    const statusText = statusLabel(o.status);
    const statusNorm = String(statusText || o.status || "").toLowerCase();
    const isDelivered =
      statusNorm.includes("entregado") || statusNorm.includes("delivered");
    const isCanceled =
      statusNorm.includes("cancelado") || statusNorm.includes("canceled");

    const canCustomerCancel =
      isCustomer &&
      !isCanceled &&
      !isDelivered &&
      [
        OrderStatus.PENDING,
        OrderStatus.ACCEPTED,
        OrderStatus.PICKED,
        OrderStatus.ON_ROUTE,
      ].includes(currentStatusKey);

    const firstItemName =
      Array.isArray(o.items) && o.items.length
        ? (o.items[0].name || `Producto ${o.items[0].productoId || o.items[0].id}`)
        : null;
    const displayDate = o.fecha ? new Date(o.fecha).toLocaleDateString() : "";
    const displayTitle = firstItemName
      ? `Pedido - ${firstItemName}${displayDate ? ` (${displayDate})` : ""}`
      : `Pedido #${o.id}`;

    const statusTimeline = [
      { key: OrderStatus.PENDING, label: statusLabel(OrderStatus.PENDING) },
      { key: OrderStatus.ACCEPTED, label: statusLabel(OrderStatus.ACCEPTED) },
      { key: OrderStatus.PICKED, label: statusLabel(OrderStatus.PICKED) },
      { key: OrderStatus.ON_ROUTE, label: statusLabel(OrderStatus.ON_ROUTE) },
      { key: OrderStatus.DELIVERED, label: statusLabel(OrderStatus.DELIVERED) },
    ];
    const activeIndex = statusTimeline.findIndex((s) => s.key === currentStatusKey);

    return (
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-xl font-semibold">{displayTitle}</h1>
            {customerName && (
              <p className="text-sm text-slate-500 mt-1">
                Cliente: {customerName}
              </p>
            )}
            {Array.isArray(o.items) && o.items.length ? (
              <ul className="mt-3 space-y-2">
                {o.items.map((it, idx) => {
                  const name = it.name || `Producto ${it.productoId || it.id}`;
                  const qty = Number(it.qty ?? it.cantidad ?? 1);
                  const price = Number(it.price ?? it.precio ?? 0);
                  const lineTotal = (qty * price).toFixed(2);
                  return (
                    <li
                      key={it.id ?? idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <span className="text-slate-700">
                          {name} x{qty}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        S/ {lineTotal}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500 mt-3">
                No hay items para mostrar.
              </p>
            )}

            {/* Timeline de estados */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-600 mb-2">
                Progreso del pedido
              </p>
              <div className="grid grid-cols-5 gap-2 text-xs text-center text-slate-600">
                {statusTimeline.map((st, idx) => {
                  const isDone = activeIndex >= idx && activeIndex !== -1;
                  const isCurrent = activeIndex === idx;
                  return (
                    <div key={st.key} className="flex flex-col items-center gap-1">
                      <div
                        className={`h-3 w-full rounded-full ${
                          isDone ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                        title={st.label}
                      />
                      <span className={`${isCurrent ? "font-semibold" : ""}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div className="card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado</span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize inline-flex items-center gap-1
                  ${
                    isDelivered
                      ? "bg-green-100 text-green-700 border-green-300"
                      : isCanceled
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }
                `}
              >
                {isDelivered && (
                  <span className="text-base leading-none">?</span>
                )}
                {isCanceled && (
                  <span className="text-base leading-none">?</span>
                )}
                {isDelivered
                  ? "Entregado"
                  : isCanceled
                  ? "Cancelado"
                  : statusText}
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
                return (
                  <span className="font-semibold">
                    S/ {computed.toFixed(2)}
                  </span>
                );
              })()}
            </div>

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
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Pago
                </p>
                <p className="text-sm text-slate-700">{paymentSummary}</p>
              </div>
            )}

            {canCustomerCancel && (
              <button
                className="btn w-full mt-4 bg-red-600 text-white hover:bg-red-700"
                onClick={() => this.cancelOrderAsCustomer()}
              >
                Cancelar pedido
              </button>
            )}

            {isCourier && !isCanceled && !isDelivered && (
              <button
                onClick={() => this.setState({ modal: true })}
                className="btn btn-primary w-full mt-4"
                disabled={!nextStatus}
              >
                {nextStatus
                  ? `Cambiar a: ${statusLabel(nextStatus)}`
                  : "Sin acciones disponibles"}
              </button>
            )}
          </div>
        </aside>

        {isCourier && this.state.modal && !isCanceled && !isDelivered && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="card relative w-full max-w-sm">
              <button
                aria-label="Cerrar"
                onClick={() => this.setState({ modal: false })}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                ?
              </button>
              <h3 className="text-lg font-semibold mb-4">
                Actualizar Estado
              </h3>
              <div className="grid gap-2">
                {nextStatus ? (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => this.updateStatus(nextStatus)}
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
