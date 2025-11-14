import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cart } from "../../src/pages/Customer/Cart";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";

describe("Cart page (integration)", () => {
  beforeEach(() => {
    appState.cart = [];
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    appState.cart = [];
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  it("reacts to cart events and navigates with aggregated total", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const emitSpy = vi.spyOn(appState, "emit");
    const cartItems = [
      { id: 10, name: "Pizza Doble", price: 20 },
      { id: 10, name: "Pizza Doble", price: 20 },
      { id: 11, name: "Bebida Premium", price: 5 },
    ];

    render(<Cart navigate={navigate} />);

    act(() => {
      appState.cart = [...cartItems];
      appState.emit(EVENTS.CART_CHANGED, cartItems);
    });

    const groupedRows = await screen.findAllByRole("listitem");
    expect(groupedRows).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: /quitar/i })[0]);

    const lastPayload = emitSpy.mock.calls.at(-1)?.[1];
    expect(lastPayload).toHaveLength(2);
    expect(lastPayload.filter((item) => item.id === 10)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /continuar al pago/i }));

    expect(navigate).toHaveBeenCalledWith("/customer/checkout", {
      state: { total: 25 },
    });

    await user.click(screen.getByRole("button", { name: /regresar a la tienda/i }));
    expect(navigate).toHaveBeenLastCalledWith("/customer");
  });
});
