import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackOrder } from "../../src/pages/Customer/TrackOrder";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";
import OrderStatus from "../../src/oop/models/OrderStatus";

describe("TrackOrder page (integration)", () => {
  beforeEach(() => {
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    appState.orders = [];
    appState.listeners?.clear?.();
  });

  it("fetches orders, syncs filters with URL params and reacts to updates", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const initialOrders = [
      {
        id: 101,
        status: OrderStatus.PENDING,
        items: [{ name: "Combo especial" }],
        total: 25,
      },
      {
        id: 202,
        status: OrderStatus.DELIVERED,
        items: [{ name: "Pizza familiar" }],
        total: 42,
      },
    ];

    vi.spyOn(appState, "fetchOrders").mockImplementation(async () => {
      appState.orders = initialOrders;
      appState.emit(EVENTS.ORDERS_CHANGED, initialOrders);
      return initialOrders;
    });

    const location = {
      pathname: "/customer/track",
      search: "?filter=pending&q=combo",
    };

    const ref = React.createRef();
    render(<TrackOrder ref={ref} navigate={navigate} location={location} />);

    await waitFor(() => expect(appState.fetchOrders).toHaveBeenCalledTimes(1));

    expect(await screen.findByText("#101")).toBeInTheDocument();
    expect(screen.queryByText("#202")).not.toBeInTheDocument();

    const statusSelect = screen.getByRole("combobox");
    await user.selectOptions(statusSelect, "all");

    expect(navigate).toHaveBeenCalledWith("/customer/track?q=combo", {
      replace: true,
    });

    const searchInput = screen.getByPlaceholderText("ID o nombre de producto");
    fireEvent.change(searchInput, { target: { value: "" } });

    expect(navigate).toHaveBeenLastCalledWith("/customer/track", {
      replace: true,
    });
    expect(await screen.findByText("#202")).toBeInTheDocument();

    act(() => {
      ref.current?.setPageSize(1);
    });

    expect(navigate).toHaveBeenLastCalledWith("/customer/track?pageSize=1", {
      replace: true,
    });

    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(navigate).toHaveBeenLastCalledWith(
      "/customer/track?page=2&pageSize=1",
      { replace: true }
    );

    await user.click(screen.getByRole("button", { name: /anterior/i }));
    expect(navigate).toHaveBeenLastCalledWith("/customer/track?pageSize=1", {
      replace: true,
    });

    await user.click(screen.getAllByRole("button", { name: /ver/i })[0]);
    expect(navigate).toHaveBeenLastCalledWith("/customer/order/101");

    const updatedOrders = [
      ...initialOrders,
      {
        id: 303,
        status: OrderStatus.ON_ROUTE,
        items: null,
        total: 30,
      },
    ];
    act(() => {
      appState.orders = updatedOrders;
      appState.emit(EVENTS.ORDERS_CHANGED, updatedOrders);
      ref.current?.setPageSize(10);
    });

    expect(await screen.findByText("#303")).toBeInTheDocument();

    await user.selectOptions(statusSelect, "en_curso");
    expect(navigate).toHaveBeenLastCalledWith("/customer/track?filter=en_curso", {
      replace: true,
    });
    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText("#303")).toBeInTheDocument();
    expect(screen.queryByText("#202")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "nomatch" } });
    expect(
      await screen.findByText("No hay pedidos que coincidan.")
    ).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "" } });
  });

  it("applies defaults when no location search is provided", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.spyOn(appState, "fetchOrders").mockResolvedValue([]);

    const ref = React.createRef();
    render(<TrackOrder ref={ref} navigate={navigate} location={undefined} />);

    await waitFor(() => expect(appState.fetchOrders).toHaveBeenCalledTimes(1));

    act(() => {
      ref.current?.setPageSize(5);
    });
    expect(navigate).toHaveBeenLastCalledWith(
      "/customer/track?pageSize=5",
      { replace: true }
    );

    act(() => {
      ref.current?.setPage(2);
    });
    expect(navigate).toHaveBeenLastCalledWith("/customer/track?page=2&pageSize=5", {
      replace: true,
    });

    const ordersWithNulls = [
      {
        id: 777,
        status: OrderStatus.PENDING,
        items: null,
        total: null,
      },
    ];
    act(() => {
      appState.orders = ordersWithNulls;
      appState.emit(EVENTS.ORDERS_CHANGED, ordersWithNulls);
    });
    expect(await screen.findByText("#777")).toBeInTheDocument();
    expect(screen.getByText("S/ 0.00")).toBeInTheDocument();

    const defaultSearch = screen.getByPlaceholderText("ID o nombre de producto");
    fireEvent.change(defaultSearch, { target: { value: "xyz" } });
    expect(
      await screen.findByText("No hay pedidos que coincidan.")
    ).toBeInTheDocument();
    fireEvent.change(defaultSearch, { target: { value: "" } });

    act(() => {
      appState.orders = null;
      appState.emit(EVENTS.ORDERS_CHANGED, null);
    });
    expect(screen.getByText("No hay pedidos que coincidan.")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "all");
  });
});
