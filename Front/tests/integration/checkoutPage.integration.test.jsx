import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Checkout } from "../../src/pages/Customer/Checkout";

const controllerHelpers = vi.hoisted(() => {
  const controllerState = { total: 0, paying: false, error: "" };
  let subscriber = null;
  const unsubscribe = vi.fn();
  const controllerInstance = {
    getState: vi.fn(() => ({ ...controllerState })),
    subscribe: vi.fn((listener) => {
      subscriber = listener;
      listener({ ...controllerState });
      return unsubscribe;
    }),
    initialize: vi.fn(),
    pay: vi.fn(),
  };
  const controllerModule = {
    getInstance: vi.fn(() => controllerInstance),
  };
  return {
    controllerState,
    controllerInstance,
    controllerModule,
    unsubscribe,
    emit(patch) {
      Object.assign(controllerState, patch);
      subscriber?.({ ...controllerState });
    },
    reset() {
      controllerState.total = 0;
      controllerState.paying = false;
      controllerState.error = "";
      subscriber = null;
      unsubscribe.mockClear();
      controllerInstance.getState.mockClear();
      controllerInstance.subscribe.mockClear();
      controllerInstance.initialize.mockClear();
      controllerInstance.pay.mockClear();
      controllerModule.getInstance.mockClear();
    },
  };
});

vi.mock("../../src/oop/controllers/CheckoutController", () => ({
  default: controllerHelpers.controllerModule,
}));

const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;

describe("Checkout page (integration)", () => {
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
    controllerHelpers.reset();
  });

  afterEach(() => {
    cleanup();
  });

  it("subscribes to controller, reacts to updates and triggers payment", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    controllerHelpers.controllerState.total = 58;

    const location = { state: { total: 120 } };
    const { rerender, unmount } = render(
      <MemoryRouter>
        <Checkout navigate={navigate} location={location} />
      </MemoryRouter>
    );

    expect(
      controllerHelpers.controllerModule.getInstance
    ).toHaveBeenCalledTimes(1);
    expect(
      controllerHelpers.controllerInstance.subscribe
    ).toHaveBeenCalledTimes(1);
    expect(
      controllerHelpers.controllerInstance.initialize
    ).toHaveBeenCalledWith({
      location,
      navigate,
    });
    expect(screen.getByText("S/ 58.00")).toBeInTheDocument();

    act(() => {
      controllerHelpers.emit({ paying: true, error: "Tarjeta rechazada" });
    });
    expect(await screen.findByText("Procesando...")).toBeInTheDocument();
    expect(screen.getByText("Tarjeta rechazada")).toBeInTheDocument();
    act(() => {
      controllerHelpers.emit({ paying: false });
    });

    act(() => {
      controllerHelpers.emit({ total: null });
    });
    expect(screen.getByText("S/ 0.00")).toBeInTheDocument();

    const updatedLocation = { state: { total: 80 } };
    rerender(
      <MemoryRouter>
        <Checkout navigate={navigate} location={updatedLocation} />
      </MemoryRouter>
    );
    expect(controllerHelpers.controllerInstance.initialize).toHaveBeenLastCalledWith({
      location: updatedLocation,
      navigate,
    });

    await user.type(
      screen.getByPlaceholderText(/Nombre y Apellidos/i),
      "Alex Tester"
    );
    await user.type(screen.getByPlaceholderText(/Tel/i), "912345678");
    await user.type(
      screen.getByPlaceholderText(/Direcci/i),
      "Av 1"
    );
    await user.selectOptions(
      screen.getByLabelText("Método de pago"),
      "card"
    );
    await user.type(
      await screen.findByPlaceholderText("Nro. tarjeta (XXXX-XXXX-XXXX-XXXX)"),
      "1234567890123456"
    );
    await user.type(screen.getByPlaceholderText("MM"), "09");
    await user.type(screen.getByPlaceholderText("AA"), "26");
    await user.type(screen.getByPlaceholderText("CVV"), "234");
    await user.type(screen.getByPlaceholderText("Nombre en la tarjeta"), "Tester");
    await user.click(screen.getByRole("button", { name: /guardar/i }));

    const submitButton = screen.getByRole("button", { name: /pagar/i });
    fireEvent.submit(submitButton.closest("form"));

    expect(controllerHelpers.controllerInstance.pay).toHaveBeenCalledTimes(1);
    const [{ event, navigate: navArg }] =
      controllerHelpers.controllerInstance.pay.mock.calls[0];
    expect(navArg).toBe(navigate);
    expect(event).toBeTruthy();
    expect(typeof event.preventDefault).toBe("function");

    unmount();
    expect(controllerHelpers.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
