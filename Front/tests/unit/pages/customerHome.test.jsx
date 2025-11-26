import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createAppStateMock } from "../../utils/appStateMock.js";
import { CustomerHome } from "../../../src/pages/Customer/CustomerHome.jsx";
import { EVENTS } from "../../../src/oop/state/events.js";

const appStateModule = vi.hoisted(() => ({ mock: null }));

vi.mock("../../../src/oop/state/AppState.js", () => ({
  get default() {
    return appStateModule.mock;
  },
}));

const syncCatalogMock = vi.hoisted(() => vi.fn());
vi.mock("../../../src/services/catalog.js", () => ({
  syncCatalog: syncCatalogMock,
}));

const storesApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  createProduct: vi.fn(),
  removeProduct: vi.fn(),
}));
vi.mock("../../../src/services/storeService.js", () => ({
  StoresApi: storesApiMock,
}));

const { mock: appStateMock, listeners, reset } = createAppStateMock();
appStateModule.mock = appStateMock;

const localStorageValues = new Map();
const localStorageMock = {
  getItem: vi.fn((key) =>
    localStorageValues.has(key) ? localStorageValues.get(key) : null
  ),
  setItem: vi.fn((key, value) => localStorageValues.set(key, value)),
  removeItem: vi.fn((key) => localStorageValues.delete(key)),
};

global.localStorage = localStorageMock;
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn();

const renderHome = () =>
  render(
    <MemoryRouter>
      <CustomerHome />
    </MemoryRouter>
  );

describe("CustomerHome", () => {
  beforeEach(() => {
    reset();
    localStorageValues.clear();
    Object.values(localStorageMock).forEach((fn) => fn.mockClear());
    Object.values(storesApiMock).forEach((fn) => fn.mockClear());
    syncCatalogMock.mockReset();
    global.alert.mockClear();
    global.confirm.mockClear();
    global.prompt.mockClear();
    appStateMock.cart = [];
    appStateMock.user = null;
  });

  it("sincroniza el catalogo al montar, carga tiendas y permite agregar al carrito", async () => {
    localStorageValues.set("user", JSON.stringify({ email: "admin@ulima.edu.pe" }));
    appStateMock.cart = [{ id: "c1" }, { id: "c2" }];
    storesApiMock.list.mockResolvedValue({
      stores: [
        {
          id: "s1",
          nombre: "Store Uno",
          descripcion: "Desc",
          logo: "logo.png",
          productos: [
            { id: "p1", nombre: "Prod Uno", descripcion: "desc p", precio: "12", foto: "pic.png" },
          ],
        },
      ],
    });
    syncCatalogMock.mockResolvedValue({});

    const view = renderHome();

    await screen.findByText("Store Uno");
    expect(syncCatalogMock).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith("catalog_synced", "1");
    expect(appStateMock.on).toHaveBeenCalledWith(EVENTS.CART_CHANGED, expect.any(Function));
    await screen.findByText(/Carrito \(2\)/i);

    fireEvent.click(screen.getByRole("button", { name: /Ver Productos/i }));
    await screen.findByText("Prod Uno");
    fireEvent.click(screen.getByRole("button", { name: /^Agregar$/i }));
    expect(appStateMock.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: "s1", qty: 1 })
    );

    listeners.get(EVENTS.CART_CHANGED)?.([{ id: "p3" }]);
    await screen.findByText(/Carrito \(1\)/i);

    view.unmount();
  });

  it("no muestra controles de sincronizacion para ningun usuario", async () => {
    localStorageValues.set("user", JSON.stringify({ email: "admin@ulima.edu.pe" }));
    storesApiMock.list.mockResolvedValue({ stores: [] });
    syncCatalogMock.mockRejectedValue(new Error("boom"));

    const adminView = renderHome();
    await screen.findAllByText(/Tiendas/i);
    expect(screen.queryByText(/Sincronizar cat/i)).not.toBeInTheDocument();

    localStorageValues.set("user", JSON.stringify({ email: "user@test.com" }));
    global.alert.mockClear();
    syncCatalogMock.mockResolvedValue({});
    adminView.unmount();
    const normalView = renderHome();
    await screen.findAllByText(/Tiendas/i);
    expect(screen.queryByText(/Sincronizar cat/i)).not.toBeInTheDocument();
    normalView.unmount();
  });

  it("ejecuta acciones de administracion sobre tiendas y productos", async () => {
    localStorageValues.set("user", JSON.stringify({ email: "admin@ulima.edu.pe" }));
    storesApiMock.list.mockResolvedValue({
      stores: [
        {
          id: "store_a",
          nombre: "Store A",
          descripcion: "Desc",
          logo: "logo.png",
          productos: [
            { id: "prod_a", nombre: "Prod A", descripcion: "Nice", precio: "9.5", foto: "pic.png" },
          ],
        },
      ],
    });
    storesApiMock.create.mockResolvedValue({});
    storesApiMock.remove.mockResolvedValue({});
    storesApiMock.createProduct.mockResolvedValue({});
    storesApiMock.removeProduct.mockResolvedValue({});
    syncCatalogMock.mockResolvedValue({});
    global.prompt
      .mockReturnValueOnce("Nueva tienda")
      .mockReturnValueOnce("Desc tienda")
      .mockReturnValueOnce("logo-new.png")
      .mockReturnValueOnce("Nuevo producto")
      .mockReturnValueOnce("15.5")
      .mockReturnValueOnce("Prod desc")
      .mockReturnValueOnce("prod.png");

    renderHome();
    await screen.findByText("Store A");

    fireEvent.click(screen.getByRole("button", { name: /\+ Agregar tienda/i }));
    await waitFor(() =>
      expect(storesApiMock.create).toHaveBeenCalledWith({
        id: "nueva_tienda",
        nombre: "Nueva tienda",
        descripcion: "Desc tienda",
        logo: "logo-new.png",
      })
    );

    fireEvent.click(screen.getByRole("button", { name: /Ver Productos/i }));
    await screen.findByText("Prod A");

    fireEvent.click(screen.getByRole("button", { name: /\+ Producto/i }));
    await waitFor(() =>
      expect(storesApiMock.createProduct).toHaveBeenCalledWith(
        "store_a",
        expect.objectContaining({
          nombre: "Nuevo producto",
          precio: 15.5,
          descripcion: "Prod desc",
          foto: "prod.png",
        })
      )
    );

    const productCard = screen.getByText("Prod A").closest("div");
    const productDelete = within(productCard).getByRole("button", { name: /^Eliminar$/i });
    fireEvent.click(productDelete);
    await waitFor(() => expect(storesApiMock.removeProduct).toHaveBeenCalledWith("prod_a"));

    const storeCard = screen.getByText("Store A").closest(".card") || screen.getByText("Store A").closest("section") || screen.getByText("Store A").parentElement;
    const storeDelete = within(storeCard).getAllByRole("button", { name: /^Eliminar$/i })[0];
    fireEvent.click(storeDelete);
    await waitFor(() => expect(storesApiMock.remove).toHaveBeenCalledWith("store_a"));

    expect(storesApiMock.list.mock.calls.length).toBeGreaterThanOrEqual(5);
  });
});
