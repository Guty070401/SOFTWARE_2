import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Checkout } from "../../src/pages/Customer/Checkout";

const helpers = vi.hoisted(() => {
  const state = { total: 15, paying: false, error: "" };
  let subscriber = null;
  const instance = {
    getState: vi.fn(() => ({ ...state })),
    subscribe: vi.fn((cb) => {
      subscriber = cb;
      cb({ ...state });
      return vi.fn();
    }),
    initialize: vi.fn(),
    pay: vi.fn(),
  };
  const module = { getInstance: () => instance };
  return {
    state,
    instance,
    module,
    emit(patch) {
      Object.assign(state, patch);
      subscriber?.({ ...state });
    },
    reset() {
      state.total = 15;
      state.paying = false;
      state.error = "";
      subscriber = null;
      instance.getState.mockClear();
      instance.subscribe.mockClear();
      instance.initialize.mockClear();
      instance.pay.mockClear();
    },
  };
});

vi.mock("../../src/oop/controllers/CheckoutController", () => ({
  default: helpers.module,
}));

const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;

describe("Checkout extra coverage", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLFormElement.prototype, "requestSubmit", {
      configurable: true,
      value: function () {
        this.submit?.();
      },
    });
  });

  afterAll(() => {
    if (originalRequestSubmit) {
      Object.defineProperty(HTMLFormElement.prototype, "requestSubmit", {
        configurable: true,
        value: originalRequestSubmit,
      });
    } else {
      delete HTMLFormElement.prototype.requestSubmit;
    }
  });

  beforeEach(() => {
    helpers.reset();
  });

  it("cubre flujos de efectivo y tarjeta incluyendo validaciones y modal", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <Checkout navigate={navigate} location={{ state: { total: 15 } }} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/M.?todo de pago/i), { target: { value: "" } });
    expect(screen.getByText(/Selecciona un m/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/M.?todo de pago/i), { target: { value: "cash" } });
    await user.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(screen.getByText(/monto/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/monto con el que pagar/i), { target: { value: "25" } });
    fireEvent.change(screen.getByPlaceholderText(/Indicaciones/), { target: { value: "nota" } });
    await user.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(screen.getByText(/Datos guardados/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Editar monto/i }));

    fireEvent.change(screen.getByLabelText(/M.?todo de pago/i), { target: { value: "card" } });
    await user.click(screen.getByRole("button", { name: /Ingresar tarjeta/i }));
    await user.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(screen.getAllByText(/Completa la informaci/i)[0]).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Nro\. tarjeta/), { target: { value: "1234567890123456" } });
    fireEvent.change(screen.getByPlaceholderText("MM"), { target: { value: "09" } });
    fireEvent.change(screen.getByPlaceholderText("AA"), { target: { value: "26" } });
    fireEvent.change(screen.getByPlaceholderText("CVV"), { target: { value: "234" } });
    fireEvent.change(screen.getByPlaceholderText(/Nombre en la tarjeta/), { target: { value: "Tester" } });
    await user.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(screen.queryByText(/Completa la informaci/i)).not.toBeInTheDocument();

    act(() => helpers.emit({ paying: true, error: "fail" }));
    expect(screen.getByText(/Procesando/i)).toBeInTheDocument();
    act(() => helpers.emit({ paying: false }));

    const form = document.querySelector("form");
    fireEvent.submit(form);
    expect(helpers.instance.pay).toHaveBeenCalled();
    const args = helpers.instance.pay.mock.calls[0][0];
    expect(args.navigate).toBe(navigate);
    expect(args.paymentDetails).toBeTruthy();
  });
});
