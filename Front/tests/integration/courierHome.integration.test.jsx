import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CourierHome from "SOFTWARE_2/Front/src/pages/Courier/CourierHome";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";

// ---- MOCK appState ----
vi.mock("../../src/oop/state/AppState", () => ({
  default: {
    orders: [],
    fetchOrders: vi.fn(),
    on: vi.fn((ev, cb) => {
      courierTestHelpers.subscriber = cb;
      return () => {};
    }),
  },
}));

const courierTestHelpers = {
  subscriber: null,
  emitOrders(orders) {
    courierTestHelpers.subscriber?.(orders);
  },
  reset() {
    appState.fetchOrders.mockReset();
    this.subscriber = null;
  },
};

describe("CourierHome (integration)", () => {
  beforeEach(() => {
    courierTestHelpers.reset();
  });

  afterEach(() => cleanup());

  it("muestra mensaje cuando no hay pedidos", () => {
    render(
      <MemoryRouter>
        <CourierHome />
      </MemoryRouter>
    );

    expect(screen.getByText("Pedidos Asignados")).toBeInTheDocument();
    expect(screen.getByText(/No hay pedidos aun/i)).toBeInTheDocument();
  });

  it("muestra pedidos cuando ORDERS_CHANGED es disparado", () => {
    render(
      <MemoryRouter>
        <CourierHome />
      </MemoryRouter>
    );

    courierTestHelpers.emitOrders([
      { id: 9, items: [], total: 20, status: "pending" },
    ]);

    expect(screen.getByText("#9")).toBeInTheDocument();
    expect(screen.getByText("S/ 20.00")).toBeInTheDocument();
  });

  it("permite abrir el detalle del pedido", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    render(
      <MemoryRouter>
        <CourierHome navigate={navigate} />
      </MemoryRouter>
    );

    courierTestHelpers.emitOrders([{ id: 3, items: [], total: 12, status: "pending" }]);

    const btn = screen.getByText("Ver detalle");
    await user.click(btn);

    expect(navigate).toHaveBeenCalledWith("/courier/order/3");
  });
});
 