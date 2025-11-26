const { ORDER_STATUS, ORDER_STATUS_FLOW, isValidOrderStatus } = require("../../src/constants/orderStatus");

describe("orderStatus constants (integration)", () => {
  it("covers status flow and validator", () => {
    expect(ORDER_STATUS_FLOW[ORDER_STATUS.PENDING]).toContain(ORDER_STATUS.ACCEPTED);
    expect(ORDER_STATUS_FLOW[ORDER_STATUS.ON_ROUTE]).toContain(ORDER_STATUS.DELIVERED);
    expect(isValidOrderStatus(ORDER_STATUS.DELIVERED)).toBe(true);
    expect(isValidOrderStatus("invalid")).toBe(false);
  });
});
