import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerOrders } from "../../src/pages/Customer/CustomerOrders";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";

describe("CustomerOrders page (integration)", () => {
  beforeEach(() => {
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  afterEach(() => {
    cleanup();
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  it("lists existing orders, navigates to detail and handles updates", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const initialOrders = [
      {
        id: 91,
        status: "pending",
        items: [{ name: "Burger" }],
        total: 20,
      },
      {
        id: 92,
        status: "delivered",
        items: [],
        total: 40,
      },
    ];
    appState.orders = [];

    const { unmount } = render(<CustomerOrders navigate={navigate} />);

    expect(screen.getByText(/no has realizado/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /volver a la tienda/i }));
    expect(navigate).toHaveBeenCalledWith("/customer");

    act(() => {
      appState.orders = initialOrders;
      appState.emit(EVENTS.ORDERS_CHANGED, initialOrders);
    });

    expect(screen.getByText("#91")).toBeInTheDocument();
    expect(screen.getByText("#92")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /ver detalle/i })[0]);
    expect(navigate).toHaveBeenCalledWith("/customer/order/91");

    await user.click(
      screen.getAllByRole("button", { name: /volver a la tienda/i })[0]
    );
    expect(navigate).toHaveBeenLastCalledWith("/customer");

    const updatedOrders = [
      ...initialOrders,
      {
        id: 93,
        status: "accepted",
        items: [{ name: "Wrap" }],
        total: 35,
      },
    ];
    act(() => {
      appState.orders = updatedOrders;
      appState.emit(EVENTS.ORDERS_CHANGED, updatedOrders);
    });

    expect(await screen.findByText("#93")).toBeInTheDocument();

    act(() => {
      appState.orders = [];
      appState.emit(EVENTS.ORDERS_CHANGED, []);
    });
    expect(screen.getByText(/no has realizado/i)).toBeInTheDocument();
    unmount();
  });
});
