import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerOrders } from "../../src/pages/Customer/CustomerOrders";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";

// Skip noisy error about missing text by using regex or exact string present

describe("CustomerOrders extra coverage", () => {
  beforeEach(() => {
    appState.orders = null;
    appState.listeners?.clear?.();
  });

  afterEach(() => {
    cleanup();
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  it("muestra error cuando fetch falla y luego renderiza pedidos entregados", async () => {
    const user = userEvent.setup();
    appState.fetchOrders = vi.fn().mockRejectedValueOnce(new Error("boom"));
    const navigate = vi.fn();
    render(<CustomerOrders navigate={navigate} />);

    expect(screen.getByText(/Cargando pedidos/i)).toBeInTheDocument();
    await act(async () => {});
    expect(await screen.findByText(/boom/)).toBeInTheDocument();

    const orders = [
      {
        id: 10,
        status: "delivered",
        items: [{ precio: 5, cantidad: 2 }],
        total: null,
      },
    ];
    act(() => {
      appState.orders = orders;
      appState.emit(EVENTS.ORDERS_CHANGED, orders);
    });
    expect(screen.getByText(/Entregado/i)).toBeInTheDocument();
    expect(screen.getByText(/S\/ 10.00/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Volver a la tienda/i }));
    expect(navigate).toHaveBeenCalledWith("/customer");
  });
});
