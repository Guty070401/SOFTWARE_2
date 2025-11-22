import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { EVENTS } from "../../../src/oop/state/events.js";
import { createAppStateMock } from "../../utils/appStateMock.js";
import { Cart } from "../../../src/pages/Customer/Cart.jsx";
import { CustomerOrders } from "../../../src/pages/Customer/CustomerOrders.jsx";
import { TrackOrder } from "../../../src/pages/Customer/TrackOrder.jsx";
import { Checkout } from "../../../src/pages/Customer/Checkout.jsx";

const appStateModule = vi.hoisted(() => ({ mock: null }));

vi.mock("../../../src/oop/state/AppState.js", () => ({
  get default(){
    return appStateModule.mock;
  },
}));

const { mock: appStateMock, listeners, reset } = createAppStateMock();
appStateModule.mock = appStateMock;

const controllerSubscribeHandler = { value: null };
const controllerMock = {
  getState: vi.fn(() => ({ total: 15, error: null, paying: false })),
  subscribe: vi.fn((cb)=> {
    controllerSubscribeHandler.value = cb;
    return vi.fn();
  }),
  initialize: vi.fn(),
  pay: vi.fn(),
};

vi.mock("../../../src/oop/controllers/CheckoutController.js", () => ({
  default: {
    getInstance: () => controllerMock,
  },
}));

describe("Customer pages", () => {
  beforeEach(() => {
    reset();
    controllerMock.getState.mockClear();
    controllerMock.subscribe.mockClear();
    controllerMock.initialize.mockClear();
    controllerMock.pay.mockClear();
    controllerSubscribeHandler.value = null;
  });

  it("renders the cart, removes items and navigates to checkout", () => {
    appStateMock.cart = [
      { id: "p1", name: "Item", price: 10 },
      { id: "p1", name: "Item", price: 10 },
    ];
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <Cart navigate={navigate} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Quitar/i));
    expect(appStateMock.emit).toHaveBeenCalledWith(
      EVENTS.CART_CHANGED,
      expect.any(Array)
    );
    fireEvent.click(screen.getByRole("button", { name: /Continuar al pago/i }));
    expect(navigate).toHaveBeenCalledWith("/customer/checkout", {
      state: { total: 10 },
    });
  });

  it("shows empty cart state when there are no items", () => {
    appStateMock.cart = [];
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <Cart navigate={navigate} />
      </MemoryRouter>
    );
    expect(screen.getByText(/agregas productos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar al pago/i })).toBeDisabled();
    fireEvent.click(screen.getByText(/Regresar a la Tienda/i));
    expect(navigate).toHaveBeenCalledWith("/customer");
  });

  it("initializes checkout controller and submits payment", async () => {
    const navigate = vi.fn();
    const view = await act(async ()=>{
      return render(
        <MemoryRouter>
          <Checkout navigate={navigate} location={{ state: { total: 50 } }} />
        </MemoryRouter>
      );
    });
    expect(controllerMock.initialize).toHaveBeenCalled();
    await act(async ()=>{
      controllerSubscribeHandler.value?.({ total: 99, error: "fail", paying: true });
    });
    const form = view.container.querySelector("form");
    await act(async ()=>{
      fireEvent.submit(form);
    });
    expect(controllerMock.pay).toHaveBeenCalled();
  });

  it("reinitializes checkout when total changes and cleans up listeners", async () => {
    const navigate = vi.fn();
    const unsubscribe = vi.fn();
    controllerMock.subscribe.mockImplementationOnce((cb)=> {
      controllerSubscribeHandler.value = cb;
      return unsubscribe;
    });
    const view = await act(async ()=>{
      return render(
        <MemoryRouter>
          <Checkout navigate={navigate} location={{ state: { total: 10 } }} />
        </MemoryRouter>
      );
    });

    await act(async ()=>{
      view.rerender(
        <MemoryRouter>
          <Checkout navigate={navigate} location={{ state: { total: 20 } }} />
        </MemoryRouter>
      );
    });

    expect(controllerMock.initialize).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

    it("formats card number as user types during checkout", async () => {
      const navigate = vi.fn();
      render(
        <MemoryRouter>
          <Checkout navigate={navigate} location={{ state: { total: 30 } }} />
        </MemoryRouter>
      );
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Ingresar tarjeta/i }));
      });
      const cardInput = await screen.findByPlaceholderText(/Nro/i);
      fireEvent.input(cardInput, { target: { value: "1234567890123456" } });
      expect(cardInput.value).toBe("1234-5678-9012-3456");
      fireEvent.input(cardInput, { target: { value: "" } });
      expect(cardInput.value).toBe("");
    });

  it("shows controller error and loading state", async () => {
    render(
      <MemoryRouter>
        <Checkout navigate={vi.fn()} location={{ state: { total: 10 } }} />
      </MemoryRouter>
    );
    await act(async ()=>{
      controllerSubscribeHandler.value?.({ error: "Fallo", paying: true, total: 0 });
    });
    expect(screen.getByText(/Fallo/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Procesando/i })).toBeDisabled();
  });

  it("lists customer orders and navigates to detail or store", () => {
    appStateMock.orders = [
      { id: 1, status: "pending", items: [{}, {}], total: "10.00" },
    ];
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <CustomerOrders navigate={navigate} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Ver detalle/i));
    expect(navigate).toHaveBeenCalledWith("/customer/order/1");
    fireEvent.click(screen.getAllByText(/Volver a la tienda/i)[0]);
    expect(navigate).toHaveBeenCalledWith("/customer");
  });

  it("shows empty state when customer has no orders", () => {
    appStateMock.orders = [];
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <CustomerOrders navigate={navigate} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Volver a la tienda/i }));
    expect(navigate).toHaveBeenCalledWith("/customer");
  });

  it("updates customer orders when store emits new data", async () => {
    const navigate = vi.fn();
    const view = render(
      <MemoryRouter>
        <CustomerOrders navigate={navigate} />
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });
    await act(async ()=>{
      listeners.get(EVENTS.ORDERS_CHANGED)?.([
        { id: 9, status: "pending", items: [{}, {}], total: "55.00" },
      ]);
    });
    expect(screen.getByText(/#9/)).toBeInTheDocument();
  });

  it("handles checkout payment methods and validations", async () => {
    render(
      <MemoryRouter>
        <Checkout navigate={vi.fn()} location={{ state: { total: 75 } }} />
      </MemoryRouter>
    );

    // Card modal validation path
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ingresar tarjeta/i }));
    });
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Guardar datos/i }));
    });
    expect(
      screen.getAllByText(/Completa la información de la tarjeta/).length
    ).toBeGreaterThan(0);

    fireEvent.input(await screen.findByPlaceholderText(/MM/), {
      target: { value: "123" },
    });
    fireEvent.input(screen.getByPlaceholderText(/CVV/), {
      target: { value: "9876" },
    });
    fireEvent.input(await screen.findByPlaceholderText(/Nro/i), {
      target: { value: "4444555566667777" },
    });
    fireEvent.input(screen.getByPlaceholderText(/AA/), {
      target: { value: "29" },
    });
    fireEvent.input(screen.getByPlaceholderText(/Nombre en la tarjeta/), {
      target: { value: "Test User" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Guardar datos/i }));
    });
    expect(screen.getByText(/Datos de tarjeta guardados/)).toBeInTheDocument();
    expect(screen.getByText(/terminada en 7777/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Editar tarjeta/i }));
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/Cerrar/));
    });
    expect(screen.queryByLabelText(/Formulario de tarjeta/)).not.toBeInTheDocument();

    // Reset error when switching method and render helper text
    fireEvent.change(screen.getByLabelText(/Método de pago/i), {
      target: { value: "" },
    });
    expect(
      screen.getByText(/Selecciona un método para ingresar los datos/)
    ).toBeInTheDocument();

    // Cash flow including validation and edit path
    fireEvent.change(screen.getByLabelText(/Método de pago/i), {
      target: { value: "cash" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(
      screen.getByText(/Ingresa el monto con el que pagarás/)
    ).toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText(/Monto con el que pagarás/), {
      target: { value: "50" },
    });
    fireEvent.input(
      screen.getByPlaceholderText(/Indicaciones para el repartidor/),
      {
        target: { value: "Dejar en portería" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(screen.getByText(/Pagará con S\/ 50.00/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Editar monto/i }));
    expect(screen.getByPlaceholderText(/Monto con el que pagarás/).value).toBe(
      "50"
    );

    fireEvent.input(screen.getByPlaceholderText(/Monto con el que pagarás/), {
      target: { value: "25" },
    });
    fireEvent.input(
      screen.getByPlaceholderText(/Indicaciones para el repartidor/),
      {
        target: { value: "   " },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /Guardar datos/i }));
    expect(screen.getByText(/Pagará con S\/ 25.00/)).toBeInTheDocument();
  });

  it("exposes handler utilities for checkout input sanitization", () => {
    const comp = new Checkout({ navigate: vi.fn(), location: { state: {} } });
    comp.state = { ...comp.state };
    comp.setState = (update) => {
      const patch = typeof update === "function" ? update(comp.state) : update;
      comp.state = { ...comp.state, ...patch };
    };

    comp.handleCardInputChange("mm", undefined);
    comp.handleCardInputChange("mm", "0a7");
    comp.handleCardInputChange("cvv", "12x45");
    comp.handleCardInputChange("cardName", " Tester ");
    comp.handleSaveCashDetails();
    comp.state.paymentMethod = "cash";
    comp.openCardModal();

    expect(comp.state.cardForm.mm).toBe("07");
    expect(comp.state.cardForm.cvv).toBe("124");
    expect(comp.state.showCardModal).toBe(false);
    expect(comp.state.detailsError).toMatch(/Ingresa el monto/);
  });

  it("computes delivered orders and robust totals", () => {
    appStateMock.orders = [
      {
        id: 77,
        status: "Delivered",
        items: [
          { precioUnitario: "2.5", cantidad: 2 },
          { price: 1, qty: 1 },
        ],
      },
      { id: 78, status: "pending", items: null, total: null },
      { id: 79, estado: "ENTREGADO", items: [{ price: 3 }], total: null },
      { id: 80, status: null, items: [{}, {}], total: null },
    ];

    render(
      <MemoryRouter>
        <CustomerOrders navigate={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Entregado/)).toHaveLength(2);
    expect(screen.getByText(/S\/ 6.00/)).toBeInTheDocument();
    expect(screen.getByText(/#78/).closest(".card")).toHaveTextContent("S/ 0.00");
    expect(screen.getByText(/#79/).closest(".card")).toHaveTextContent("S/ 3.00");
    expect(screen.getByText(/#80/).closest(".card")).toHaveTextContent("S/ 0.00");
  });

  it("shows loading, uses fetch results and unsubscribes on unmount", async () => {
    const ordersFromFetch = [{ id: 5, status: "pending", items: [] }];
    appStateMock.orders = null;
    appStateMock.fetchOrders.mockResolvedValue(ordersFromFetch);

    const navigate = vi.fn();
    const view = render(
      <MemoryRouter>
        <CustomerOrders navigate={navigate} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Cargando pedidos/)).toBeInTheDocument();
    expect(await screen.findByText(/#5/)).toBeInTheDocument();

    view.unmount();
    expect(listeners.size).toBe(0);
  });

  it("handles fetch errors without mounted component", async () => {
    appStateMock.orders = null;
    appStateMock.fetchOrders.mockRejectedValue(null);

    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <CustomerOrders navigate={navigate} />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/No se pudieron cargar los pedidos/)
    ).toBeInTheDocument();
  });

  it("ignores async updates once unmounted", async () => {
    appStateMock.orders = null;
    let resolveFetch;
    let rejectFetch;
    appStateMock.fetchOrders.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveFetch = resolve;
          rejectFetch = reject;
        })
    );

    const view = render(
      <MemoryRouter>
        <CustomerOrders navigate={vi.fn()} />
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    const orderChangeHandler = listeners.get(EVENTS.ORDERS_CHANGED);
    view.unmount();

    act(() => {
      orderChangeHandler?.([{ id: 3 }]);
    });

    await act(async () => {
      resolveFetch?.([{ id: 4 }]);
      rejectFetch?.(new Error("boom"));
    });
    expect(listeners.size).toBe(0);
  });

  it("skips fetch updates after manual unmount lifecycle", async () => {
    appStateMock.orders = null;
    let resolveFetch;
    let rejectFetch;
    appStateMock.fetchOrders.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveFetch = resolve;
          rejectFetch = reject;
        })
    );

    const comp = new CustomerOrders({ navigate: vi.fn() });
    comp.setState = (update) => {
      const patch = typeof update === "function" ? update(comp.state) : update;
      comp.state = { ...comp.state, ...patch };
    };

    comp.componentDidMount();
    await act(async () => {
      await Promise.resolve();
    });
    comp.componentWillUnmount();

    await act(async () => {
      rejectFetch?.(new Error("fail"));
      await Promise.resolve();
    });

    expect(comp.state.loading).toBe(true);
    expect(comp.state.orders).toEqual([]);
  });

  it("stores error details when fetch fails while mounted", async () => {
    appStateMock.orders = null;
    appStateMock.fetchOrders.mockRejectedValue(new Error("late"));

    const comp = new CustomerOrders({ navigate: vi.fn() });
    comp.setState = (update) => {
      const patch = typeof update === "function" ? update(comp.state) : update;
      comp.state = { ...comp.state, ...patch };
    };

    await act(async () => {
      comp.componentDidMount();
      await Promise.resolve();
    });

    expect(comp.state.error).toContain("late");
    expect(comp.state.loading).toBe(false);
  });

  it("keeps existing orders when fetch returns after snapshot", async () => {
    appStateMock.orders = [{ id: 1 }];
    appStateMock.fetchOrders.mockResolvedValue([{ id: 2 }]);

    const comp = new CustomerOrders({ navigate: vi.fn() });
    comp.setState = (update) => {
      const patch = typeof update === "function" ? update(comp.state) : update;
      comp.state = { ...comp.state, ...patch };
    };

    await act(async () => {
      comp.componentDidMount();
      await Promise.resolve();
    });

    expect(comp.state.orders).toEqual([{ id: 1 }]);
  });

  it("filters and paginates track order list", async () => {
    const baseOrders = Array.from({ length: 15 }).map((_, idx) => ({
      id: idx + 1,
      status: idx % 2 === 0 ? "pending" : "delivered",
      items: [{ name: idx % 2 === 0 ? "Burger" : "Soda" }],
      total: idx + 0.5,
    }));
    baseOrders.splice(5, 0, {
      id: 999,
      status: "pending",
      items: null,
      total: null,
    });
    appStateMock.orders = baseOrders;
    const navigate = vi.fn();
    render(
      <MemoryRouter initialEntries={["/customer/track?page=2&pageSize=5"]}>
        <TrackOrder navigate={navigate} location={{ pathname: "/customer/track", search: "?page=2&pageSize=5" }} />
      </MemoryRouter>
    );
    const zeroCardElement = (await screen.findByText(/#999/)).closest(".card") ?? screen.getByText(/#999/).parentElement?.parentElement;
    const zeroCard = within(zeroCardElement);
    expect(zeroCard.getByText(/0.*tems/i)).toBeInTheDocument();
    expect(zeroCard.getByText(/S\/ 0\.00/)).toBeInTheDocument();
    const statusSelect = screen.getAllByRole("combobox")[0];
    await act(async ()=>{
      fireEvent.change(statusSelect, { target: { value: "en_curso" } });
      fireEvent.change(screen.getByPlaceholderText(/ID o nombre/), { target: { value: "Burger" } });
      fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    });
    await act(async ()=>{
      fireEvent.change(statusSelect, { target: { value: "pending" } });
    });
    expect(navigate).toHaveBeenCalled();
    await act(async ()=>{
      fireEvent.click(screen.getAllByRole("button", { name: /Ver/i })[0]);
    });
    const lastCall = navigate.mock.calls[navigate.mock.calls.length - 1]?.[0];
    expect(lastCall).toMatch(/\/customer\/order\//);
  });

  it("syncs track order filters via URL helpers", () => {
    const navigate = vi.fn();
    const tracker = new TrackOrder({
      navigate,
      location: { pathname: "/customer/track", search: "?filter=en_curso&q=burg&page=2&pageSize=2" },
    });
    tracker.state = {
      ...tracker.state,
      orders: [
        { id: 1, status: "pending", items: [{ name: "Burger" }], total: 5 },
        { id: 2, status: "delivered", items: [{ name: "Soda" }], total: 4 },
      ],
    };
    tracker.setState = (update, cb)=>{
      const patch = typeof update === "function" ? update(tracker.state) : update;
      tracker.state = { ...tracker.state, ...patch };
      cb?.();
    };

    tracker.syncFromUrl();
    expect(tracker.state.page).toBe(2);
    expect(tracker.state.pageSize).toBe(2);

    tracker.setFilter("en_curso");
    tracker.setQuery("burger");
    tracker.setPageSize(5);
    tracker.setPage(0);
    const filtered = tracker.filtered();
    expect(filtered).toHaveLength(1);

    tracker.syncToUrl();
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("filter=en_curso"), { replace: true });
  });

  it("navigates to default track path when location is missing", () => {
    const navigate = vi.fn();
    const tracker = new TrackOrder({ navigate, location: null });
    tracker.state = { ...tracker.state };
    tracker.setState = (update, cb)=>{
      const patch = typeof update === "function" ? update(tracker.state) : update;
      tracker.state = { ...tracker.state, ...patch };
      cb?.();
    };
    tracker.setFilter("pending");
    expect(navigate).toHaveBeenCalledWith("/customer/track?filter=pending", { replace: true });
  });
});
