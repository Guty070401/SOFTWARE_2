const OrderStatus = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  PICKED: "picked",
  ON_ROUTE: "on_route",
  DELIVERED: "delivered",
  CANCELED: "canceled",
});

export function statusLabel(status){
  const map = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    picked: 'Recogido',
    on_route: 'En camino',
    delivered: 'Entregado',
    canceled: 'Cancelado',
  };
  const key = String(status || '').toLowerCase().replace(/\s+/g, '_');
  return map[key] || status || '';
}

export default OrderStatus;
