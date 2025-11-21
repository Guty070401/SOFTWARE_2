import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CustomerHome from "../../src/pages/Customer/CustomerHome";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";

// ---- MOCK appState ----
vi.mock("../../src/oop/state/AppState", () => ({
  default: {
    cart: [],
    addToCart: vi.fn(),
    on: vi.fn((event, cb) => {
      customerTestHelpers.subscriber = cb;
      return () => {};
    }),
  },
}));

const customerTestHelpers = {
  subscriber: null,
  emitCartChanged(cart) {
    this.subscriber && this.subscriber(cart);
  },
  reset() {
    appState.addToCart.mockReset();
    this.subscriber = null;
  },
};

describe("CustomerHome page (integration)", () => {
  beforeEach(() => {
    customerTestHelpers.reset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza tiendas y acciones básicas", () => {
    render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>
    );

    expect(screen.getByText("Tiendas")).toBeInTheDocument();
    expect(screen.getByText("Elige tu tienda y platos favoritos")).toBeInTheDocument();

    // Nombres de tiendas de fábrica
    expect(screen.getByText("Bembos")).toBeInTheDocument();
    expect(screen.getByText("La Nevera Fit")).toBeInTheDocument();
    expect(screen.getByText("Mr. Sushi")).toBeInTheDocument();

    // Botones importantes
    expect(screen.getByText("+ Agregar tienda")).toBeInTheDocument();
    expect(screen.getByText("Reset catálogo (local)")).toBeInTheDocument();
    expect(screen.getByText("Sincronizar catálogo")).toBeInTheDocument();
    expect(screen.getByText(/Carrito/i)).toBeInTheDocument();
    expect(screen.getByText("Ver pedidos")).toBeInTheDocument();
  });

  it("filtra tiendas usando el select", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>
    );

    const select = screen.getByRole("combobox");

    await user.selectOptions(select, "s1");

    expect(screen.getByText("Bembos")).toBeInTheDocument();
    expect(screen.queryByText("La Nevera Fit")).not.toBeInTheDocument();
    expect(screen.queryByText("Mr. Sushi")).not.toBeInTheDocument();
  });

  it("abre y cierra los productos de una tienda", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>
    );

    const btn = screen.getAllByText("Ver Productos")[0];
    await user.click(btn);

    expect(screen.getByText(/Productos de/i)).toBeInTheDocument();

    await user.click(btn);
    expect(screen.queryByText(/Productos de/i)).not.toBeInTheDocument();
  });

  it("agrega productos al carrito", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>
    );

    const verBtn = screen.getAllByText("Ver Productos")[0];
    await user.click(verBtn);

    const addButton = screen.getAllByText("Agregar")[0];

    await user.click(addButton);

    expect(appState.addToCart).toHaveBeenCalled();
  });

  it("actualiza el contador del carrito cuando CART_CHANGED es disparado", () => {
    render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>
    );

    // Antes del evento
    expect(screen.getByText(/Carrito \(0\)/)).toBeInTheDocument();

    // Emitir evento
    customerTestHelpers.emitCartChanged([{ id: 1 }]);

    // Después del evento
    expect(screen.getByText(/Carrito \(1\)/)).toBeInTheDocument();
  });
});
