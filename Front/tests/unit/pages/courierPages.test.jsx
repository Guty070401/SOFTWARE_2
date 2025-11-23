import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { createAppStateMock } from "../../utils/appStateMock.js";
import { CourierHome } from "../../../src/pages/Courier/CourierHome.jsx";
import { OrderDetail } from "../../../src/pages/Courier/OrderDetail.jsx";
import { EVENTS } from "../../../src/oop/state/events.js";

const appStateModule = vi.hoisted(() => ({ mock: null }));

vi.mock("../../../src/oop/state/AppState.js", () => ({
  get default(){
    return appStateModule.mock;
  },
}));

const { mock: appStateMock, listeners, reset } = createAppStateMock();
appStateModule.mock = appStateMock;

describe("Courier pages", () => {
  beforeEach(() => {
    reset();
  });

  it("renders courier home and navigates to order detail", () => {
    appStateMock.orders = [
      { id: 10, status: "pending", items: [{ name: "Item" }], total: 15 },
      { id: 20, status: "delivered", items: null, total: null },
    ];
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <CourierHome navigate={navigate} />
      </MemoryRouter>
    );
    act(()=> listeners.get(EVENTS.ORDERS_CHANGED)?.(appStateMock.orders));
    fireEvent.click(screen.getAllByText(/Ver detalle/i)[0]);
    expect(navigate).toHaveBeenCalledWith("/courier/order/10");
  });

  it("shows empty courier message when there are no orders", () => {
    appStateMock.orders = [];
    render(
      <MemoryRouter>
        <CourierHome navigate={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/No hay pedidos aun/i)).toBeInTheDocument();
  });

  it("loads order detail, updates status and handles modal", async () => {
    appStateMock.orders = [
      {
        id: "55",
        status: "pending",
        items: [{ id: "p1", name: "Item", qty: 1, price: 10, image: "img.png" }],
        total: 10,
        customerName: "Alice",
      },
    ];
    appStateMock.user = { role: "courier" };
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <OrderDetail params={{ id: "55" }} navigate={navigate} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Cambiar a/i }));
    const modalButton = await screen.findAllByRole("button", { name: /Cambiar a/i });
    fireEvent.click(modalButton[modalButton.length - 1]);
    expect(appStateMock.updateStatus).toHaveBeenCalledWith("55", "accepted");
  });

  it("renders fallback content and skips transitions when completed", async () => {
    appStateMock.orders = [
      {
        id: "90",
        status: "delivered",
        items: null,
        total: null,
        customer: { name: "Bob" },
      },
    ];
    appStateMock.user = { role: "courier" };
    const ref = React.createRef();
    render(
      <MemoryRouter>
        <OrderDetail ref={ref} params={{ id: "90" }} navigate={vi.fn()} />
      </MemoryRouter>
    );
    expect(await screen.findByText(/No hay .*mostrar/i)).toBeInTheDocument();
    await act(async ()=>{
      ref.current?.setState({ modal: true });
    });
    expect(screen.queryByText(/No hay transiciones disponibles/i)).not.toBeInTheDocument();
  });

  it("computes totals from item list when value is missing", () => {
    appStateMock.orders = [
      {
        id: "81",
        status: "accepted",
        items: [{ precio: 5, cantidad: 2 }],
        total: null,
      },
    ];
    appStateMock.user = { role: "customer" };
    render(
      <MemoryRouter>
        <OrderDetail params={{ id: "81" }} navigate={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/S\/ 10\.00/)[0]).toBeInTheDocument();
  });

  it("renders fallback UI when order is not found", () => {
    appStateMock.orders = [];
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <OrderDetail params={{ id: "missing" }} navigate={navigate} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Pedido no encontrado/i)).toBeInTheDocument();
  });

  it("shows customer view with computed totals and no courier actions", () => {
    appStateMock.orders = [
      {
        id: "77",
        status: "delivered",
        items: [{ precio: 5, cantidad: 2 }],
        customer: { name: "Bob" },
        total: null,
      },
    ];
    appStateMock.user = { role: "customer" };
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <OrderDetail params={{ id: "77" }} navigate={navigate} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Cliente: Bob/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a pedidos realizados/i })).toBeInTheDocument();
    expect(screen.getAllByText(/S\/ 10\.00/)[0]).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cambiar a/i })).toBeNull();
  });

  it("unsubscribes from order listeners on unmount", () => {
    const unsub = vi.fn();
    appStateMock.orders = [
      {
        id: "65",
        status: "pending",
        items: [],
        total: 0,
      },
    ];
    appStateMock.user = { role: "courier" };
    appStateMock.on.mockImplementationOnce(() => unsub);
    const utils = render(
      <MemoryRouter>
        <OrderDetail params={{ id: "65" }} navigate={vi.fn()} />
      </MemoryRouter>
    );
    utils.unmount();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
