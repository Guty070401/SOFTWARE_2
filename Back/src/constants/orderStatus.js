// Back/src/constants/orderStatus.js
const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKED: 'picked',
  ON_ROUTE: 'on_route',
  DELIVERED: 'delivered',
  CANCELED: 'canceled'
});

const ORDER_STATUS_FLOW = Object.freeze({
  [ORDER_STATUS.PENDING]:   [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.ACCEPTED]:  [ORDER_STATUS.PICKED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.PICKED]:    [ORDER_STATUS.ON_ROUTE, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.ON_ROUTE]:  [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.CANCELED]:  [],
  [ORDER_STATUS.DELIVERED]: []
});

function isValidOrderStatus(status) {
  return Object.values(ORDER_STATUS).includes(status);
}

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
  isValidOrderStatus
};
