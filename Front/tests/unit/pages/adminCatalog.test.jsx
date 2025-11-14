import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminCatalog from "../../../src/pages/AdminCatalog.jsx";

const storesApi = vi.hoisted(()=> ({
  list: vi.fn(),
  create: vi.fn(),
  createProduct: vi.fn(),
  remove: vi.fn(),
  removeProduct: vi.fn(),
  exportJSON: vi.fn(),
  importJSON: vi.fn(),
}));

vi.mock("../../../src/services/storeService", () => ({
  StoresApi: storesApi,
}));

describe("AdminCatalog page", () => {
  const sampleStore = {
    id: "store_demo",
    nombre: "Demo Store",
    desc: "Demo",
    logo: "logo.png",
    productos: [
      { id: "prod_1", nombre: "Item 1", descripcion: "Desc", precio: 9 },
    ],
  };

  beforeEach(() => {
    Object.values(storesApi).forEach((fn)=> fn.mockReset());
    storesApi.list.mockResolvedValue({ stores: [sampleStore, { id: "store_empty", nombre: "Empty", desc: "Desc", logo: "", productos: [] }] });
    storesApi.create.mockResolvedValue({});
    storesApi.createProduct.mockResolvedValue({});
    storesApi.remove.mockResolvedValue({});
    storesApi.removeProduct.mockResolvedValue({});
    storesApi.exportJSON.mockResolvedValue(new Blob(["{}"], { type: "application/json" }));
    storesApi.importJSON.mockResolvedValue({});
    global.confirm = vi.fn(() => true);
    global.prompt = vi.fn();
    global.alert = vi.fn();
    global.URL ||= {};
    global.URL.createObjectURL = vi.fn(() => "blob:demo");
    global.URL.revokeObjectURL = vi.fn();
    const storage = new Map();
    global.localStorage = {
      getItem: vi.fn((key)=> storage.has(key) ? storage.get(key) : null),
      setItem: vi.fn((key, value)=> storage.set(key, value)),
      removeItem: vi.fn((key)=> storage.delete(key)),
    };
  });

  it("creates, updates and removes stores and products", async () => {
    render(<AdminCatalog />);
    await screen.findByText("Demo Store");

    fireEvent.change(screen.getByPlaceholderText(/id \(ej\. store_demo\)/i), { target: { value: "store_new" } });
    fireEvent.change(screen.getAllByPlaceholderText("Nombre")[0], { target: { value: "Nueva" } });
    fireEvent.change(screen.getByPlaceholderText("Logo URL"), { target: { value: "logo-new.png" } });
    storesApi.list.mockResolvedValueOnce({ stores: null });
    fireEvent.submit(screen.getByRole("button", { name: /Crear tienda/i }).closest("form"));

    await waitFor(() => expect(storesApi.create).toHaveBeenCalledWith({ id: "store_new", nombre: "Nueva", logo: "logo-new.png" }));
    expect(await screen.findByText(/Tienda creada/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Tienda ID/i), { target: { value: "store_demo" } });
    fireEvent.change(screen.getByPlaceholderText(/Producto ID/i), { target: { value: "prod_new" } });
    fireEvent.change(screen.getAllByPlaceholderText("Nombre")[1], { target: { value: "Prod" } });
    fireEvent.change(screen.getByPlaceholderText(/Descripci/i), { target: { value: "Rico" } });
    fireEvent.change(screen.getByPlaceholderText(/Precio/i), { target: { value: "25.5" } });
    fireEvent.change(screen.getByPlaceholderText(/Foto URL/i), { target: { value: "foto.png" } });
    fireEvent.submit(screen.getByRole("button", { name: /Crear producto/i }).closest("form"));

    await waitFor(() => expect(storesApi.createProduct).toHaveBeenCalledWith("store_demo", expect.objectContaining({ id: "prod_new", precio: 25.5 })));
    expect(await screen.findByText(/Producto creado/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sin productos/i)).toBeInTheDocument();

    global.confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: /Borrar/i }));
    expect(storesApi.removeProduct).not.toHaveBeenCalled();

    global.confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Borrar/i }));
    expect(storesApi.removeProduct).toHaveBeenCalledWith("prod_1");

    const deleteButtons = screen.getAllByRole("button", { name: /^Eliminar$/i });
    global.confirm.mockReturnValueOnce(false);
    fireEvent.click(deleteButtons[0]);
    expect(storesApi.remove).not.toHaveBeenCalled();

    global.confirm.mockReturnValue(true);
    fireEvent.click(deleteButtons[0]);
    expect(storesApi.remove).toHaveBeenCalledWith("store_demo");

  });

  it("exports and imports catalog files", async () => {
    render(<AdminCatalog />);
    await screen.findByText("Demo Store");

    fireEvent.click(screen.getByRole("button", { name: /Exportar JSON/i }));
    await waitFor(() => expect(storesApi.exportJSON).toHaveBeenCalled());
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:demo");

    const fileInput = screen.getByLabelText(/Importar JSON/i);
    fireEvent.change(fileInput, {
      target: {
        files: [{ text: vi.fn().mockResolvedValue(JSON.stringify({ tiendas: [], productos: [] })) }],
      },
    });
    await waitFor(() => expect(storesApi.importJSON).toHaveBeenCalled());

    fireEvent.change(fileInput, { target: { files: [], value: "" } });
    expect(storesApi.importJSON).toHaveBeenCalledTimes(1);
  });
});
