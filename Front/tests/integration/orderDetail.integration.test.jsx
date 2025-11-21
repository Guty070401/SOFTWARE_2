import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import OrderDetail from "../../src/pages/Courier/OrderDetail";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";
import OrderStatus from "../../src/oop/models/OrderStatus";

// --- MOCK appState ---
vi.mock("../../src/oop/state/AppState", () => ({
  default: {
    user: { role: "courier" },
    orders: [],
    updateStatus: vi.fn(),
    on: vi.fn((ev, cb) => {
      detailHelpers.subscriber = cb;
      return () => {};
    }),
  },
}));

const detailHelpers = {
  subscriber: null,
  emitOrders() {
    detailHelpers.subscriber?.();
  },
  reset() {
    appState.updateStatus.mockReset();
    this.subscriber = null;
  },
};

function mountDetail(params, initialOrders) {
  appState.orders = initialOrders;

  return render(
    <MemoryRouter>
      <OrderDetail params={params} />
    </MemoryRouter>
  );
}

describe("OrderDetail (integration)", () => {
  beforeEach(() => detailHelpers.reset());
  afterEach(() => cleanup());

  it("muestra mensaje si el pedido no existe", () => {
    mountDetail({ id: 99 }, []);

    expect(screen.getByText("Pedido no encontrado.")).toBeInTheDocument();
  });

  it("renderiza el pedido cuando existe", () => {
    mountDetail({ id: 5 }, [
      { id: 5, status: "pending", items: [{ id: 1, price: 10, qty: 1 }] },
    ]);

    expect(screen.getByText("Pedido #5")).toBeInTheDocument();
    expect(screen.getByText("S/ 10.00")).toBeInTheDocument();
  });

  it("muestra botón para avanzar al siguiente estado", async () => {
    mountDetail({ id: 5 }, [
      { id: 5, status: OrderStatus.PENDING, items: [] },
    ]);

    const btn = screen.getByRole("button", { name: /cambiar a/i });
    expect(btn).toBeInTheDocument();
  });

  it("abre modal y actualiza estado", async () => {
    const user = userEvent.setup();

    mountDetail({ id: 5 }, [
      { id: 5, status: OrderStatus.PENDING, items: [] },
    ]);

    const openBtn = screen.getByRole("button", { name: /cambiar a/i });
    await user.click(openBtn);

    expect(screen.getByText("Actualizar Estado")).toBeInTheDocument();

    const actionBtn = screen.getByRole("button", { name: /cambiar a/i });
    await user.click(actionBtn);

    expect(appState.updateStatus).toHaveBeenCalled();
  });
});
