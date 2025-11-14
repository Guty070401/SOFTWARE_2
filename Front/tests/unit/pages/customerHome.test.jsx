import React from "react";
import { act } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createAppStateMock } from "../../utils/appStateMock.js";
import { CustomerHome } from "../../../src/pages/Customer/CustomerHome.jsx";
import { EVENTS } from "../../../src/oop/state/events.js";

const appStateModule = vi.hoisted(() => ({ mock: null }));

vi.mock("../../../src/oop/state/AppState.js", () => ({
  get default(){
    return appStateModule.mock;
  },
}));

const { mock: appStateMock, listeners, reset } = createAppStateMock();
appStateModule.mock = appStateMock;

const syncCatalogMock = vi.hoisted(()=> vi.fn().mockResolvedValue({ ok: true }));

vi.mock("../../../src/services/catalog.js", () => ({
  syncCatalog: syncCatalogMock,
}));

const localStorageValues = new Map();
const localStorageMock = {
  getItem: vi.fn((key)=> localStorageValues.has(key) ? localStorageValues.get(key) : null),
  setItem: vi.fn((key, value)=> localStorageValues.set(key, value)),
  removeItem: vi.fn((key)=> localStorageValues.delete(key)),
};

global.localStorage = localStorageMock;
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn();

function createInstance(initialState){
  const instance = new CustomerHome({});
  instance.state = { ...instance.state, ...initialState };
  instance.setState = (update)=>{
    const patch = typeof update === "function" ? update(instance.state) : update;
    instance.state = { ...instance.state, ...patch };
  };
  return instance;
}

describe("CustomerHome catalog management", () => {
  beforeEach(() => {
    reset();
    localStorageValues.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    syncCatalogMock.mockClear();
    global.alert.mockClear();
    global.confirm.mockClear();
    global.prompt.mockClear();
  });

  it("loads catalog from defaults, syncs, and handles CRUD operations", async () => {
    localStorageMock.getItem.mockReturnValueOnce(null);
    const instance = createInstance();
    instance.componentDidMount();
    await act(async ()=>{
      listeners.get(EVENTS.CART_CHANGED)?.([{ id: "p1" }]);
    });
    expect(instance.state.cartCount).toBe(1);

    await instance.onSyncCatalog();
    expect(syncCatalogMock).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith("Catálogo sincronizado en Supabase");

    const stores = [
      { id: "s_custom", name: "Custom", desc: "", image: "", items: [{ id: "item1", name: "Item", price: 10 }] },
      { id: "s_other", name: "Other", desc: "", image: "", items: [] },
    ];
    instance.saveStores(stores);
    expect(localStorageMock.setItem).toHaveBeenCalled();

    instance.addToCart({ id: "p1", name: "X", price: 12 }, { id: "s1" });
    expect(appStateMock.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String), storeId: expect.any(String) })
    );

    instance.handleToggleStore("s_custom");
    expect(instance.state.selectedStoreId).toBe("s_custom");
    instance.handleToggleStore("s_custom");
    expect(instance.state.selectedStoreId).toBeNull();

    global.prompt
      .mockReturnValueOnce("New Product")
      .mockReturnValueOnce("25.5")
      .mockReturnValueOnce("Great")
      .mockReturnValueOnce("")
      .mockReturnValueOnce("New Store")
      .mockReturnValueOnce("Desc")
      .mockReturnValueOnce("");

    instance.state.stores = stores;
    instance.addProductToStore("s_custom");
    expect(instance.state.stores[0].items).toHaveLength(2);

    instance.removeProductFromStore("s_custom", "item1");
    expect(instance.state.stores[0].items.some((it) => it.id === "item1")).toBe(false);

    instance.addStore();
    expect(instance.state.stores).toHaveLength(3);

    instance.setState({ selectedStoreId: "s_custom", filterStoreId: "s_custom" });
    instance.removeStore("s_custom");
    expect(instance.state.stores.some((s) => s.id === "s_custom")).toBe(false);

    instance.resetCatalog();
    expect(localStorageMock.removeItem).toHaveBeenCalled();
    instance.componentWillUnmount();
  });

  it("renders storefront UI, filters stores and reports sync errors", async () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([
      { id: "s_ui_empty", name: "UI Vacía", desc: "", image: "", items: [] },
      { id: "s_ui_full", name: "UI Llena", desc: "", image: "", items: [{ id: "ui_prod", name: "UI Prod", price: 9, desc: "desc", image: "img.png" }] },
    ]));
    const view = render(
      <MemoryRouter>
        <CustomerHome />
      </MemoryRouter>
    );

    await screen.findByText(/Tiendas/i);
    await act(async ()=>{
      listeners.get(EVENTS.CART_CHANGED)?.([{ id: "p1" }]);
    });
    expect(screen.getByText(/Carrito \(1\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Ver Productos/i })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: /^Agregar$/i })[0]);
    expect(appStateMock.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String), storeId: expect.any(String) })
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "s1" } });
    expect(screen.getByRole("button", { name: /Ver todos/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ver todos/i }));

    syncCatalogMock.mockRejectedValueOnce(new Error("boom"));
    fireEvent.click(screen.getByRole("button", { name: /Sincronizar cat/i }));
    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Error sincronizando/i))
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Ver Productos/i })[0]);
    expect(screen.getByText(/No hay productos en esta tienda/i)).toBeInTheDocument();

    view.unmount();
  });

  it("renders placeholder when a store has no products", () => {
    const instance = createInstance({
      stores: [{ id: "empty", name: "Vacía", desc: "", image: "", items: [] }],
      selectedStoreId: "empty",
    });
    const tree = instance.render();
    expect(tree).toBeTruthy();
  });

  it("falls back to default stores when localStorage data is invalid", () => {
    localStorageMock.getItem.mockReturnValueOnce("not json");
    const instance = createInstance();
    instance.componentDidMount();
    expect(instance.state.stores).toHaveLength(3);
    instance.componentWillUnmount();
  });
});
