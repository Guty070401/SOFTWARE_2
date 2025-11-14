const storeService = require("../../src/services/storeService");
const { supabase } = require("../../src/data/database");

describe("storeService", () => {
  beforeEach(() => {
    supabase.from = jest.fn();
  });

  const mockSelectChain = (result) => () => ({
    order: () => Promise.resolve(result),
  });

  it("lists stores with their products", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "tiendas") {
        return { select: mockSelectChain({ data: [{ id: "t1", nombre_origen: "Bembos", logo: "logo.png" }], error: null }) };
      }
      if (table === "productos") {
        return {
          select: () =>
            Promise.resolve({
              data: [
                { id: "p1", tienda_id: "t1", nombre: "Combo", descripcion: "desc", precio: "12.5", foto: "foto.jpg" },
                { id: "p2", tienda_id: "t2", nombre: "Otro", descripcion: "", precio: "9", foto: null },
              ],
              error: null,
            }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const stores = await storeService.listStores();
    expect(stores).toEqual([
      {
        id: "t1",
        nombre: "Bembos",
        logo: "logo.png",
        productos: [
          {
            id: "p1",
            nombre: "Combo",
            descripcion: "desc",
            precio: 12.5,
            foto: "foto.jpg",
          },
        ],
      },
    ]);
  });

  it("propagates errors from listStores queries", async () => {
    supabase.from.mockReturnValueOnce({
      select: mockSelectChain({ data: null, error: { message: "fail" } }),
    });

    await expect(storeService.listStores()).rejects.toMatchObject({ message: "fail" });
  });

  it("gets store and product records", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "tiendas") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: "t1", nombre_origen: "Tienda Uno", logo: "logo" }, error: null }),
            }),
          }),
        };
      }
      if (table === "productos") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: "p1", tienda_id: "t1", nombre: "Prod", descripcion: null, precio: "4.5", foto: null }, error: null }),
            }),
          }),
        };
      }
      throw new Error("unexpected table");
    });

    await expect(storeService.getStore("t1")).resolves.toEqual({ id: "t1", nombre: "Tienda Uno", logo: "logo" });
    await expect(storeService.getProduct("p1")).resolves.toEqual({
      id: "p1",
      tiendaId: "t1",
      nombre: "Prod",
      descripcion: null,
      precio: 4.5,
      foto: null,
    });
  });

  it("returns null when store/product not found", async () => {
    supabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }));

    await expect(storeService.getStore("missing")).resolves.toBeNull();
    await expect(storeService.getProduct("missing")).resolves.toBeNull();
  });

  it("creates, updates and deletes stores", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "tiendas") {
        return {
          insert: (payload) => {
            expect(payload).toEqual({ id: "t5", nombre_origen: "Nueva", logo: null });
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: "t5", nombre_origen: "Nueva", logo: null }, error: null }),
              }),
            };
          },
          update: (patch) => {
            expect(patch).toEqual({ nombre_origen: "Editada", logo: "logo.png" });
            return {
              eq: (field, value) => {
                expect(field).toBe("id");
                expect(value).toBe("t5");
                return {
                  select: () => ({
                    single: () => Promise.resolve({ data: { id: "t5", nombre_origen: "Editada", logo: "logo.png" }, error: null }),
                  }),
                };
              },
            };
          },
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      throw new Error("unexpected table");
    });

    await expect(storeService.createStore({ id: "t5", nombre: "Nueva" })).resolves.toEqual({
      id: "t5",
      nombre: "Nueva",
      logo: null,
    });
    await expect(storeService.updateStore("t5", { nombre: "Editada", logo: "logo.png" })).resolves.toEqual({
      id: "t5",
      nombre: "Editada",
      logo: "logo.png",
    });
    await expect(storeService.deleteStore("t5")).resolves.toBeUndefined();
  });

  it("handles product CRUD helpers", async () => {
    supabase.from.mockImplementation((table) => {
      if (table === "productos") {
        return {
          select: () => ({
            eq: (field, value) => {
              expect(field).toBe("tienda_id");
              expect(value).toBe("t1");
              return Promise.resolve({
                data: [{ id: "p1", tienda_id: "t1", nombre: "Prod1", descripcion: "", precio: "3.5", foto: null }],
                error: null,
              });
            },
          }),
          insert: (payload) => {
            expect(payload).toEqual({
              id: "p2",
              tienda_id: "t1",
              nombre: "Nuevo",
              descripcion: null,
              precio: 10,
              foto: null,
            });
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: "p2", tienda_id: "t1", nombre: "Nuevo", descripcion: null, precio: "10", foto: null },
                    error: null,
                  }),
              }),
            };
          },
          update: (patch) => {
            expect(patch).toEqual({ nombre: "Edit", precio: 15 });
            return {
              eq: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: { id: "p2", tienda_id: "t1", nombre: "Edit", descripcion: null, precio: "15", foto: null },
                      error: null,
                    }),
                }),
              }),
            };
          },
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      throw new Error("unexpected table");
    });

    await expect(storeService.listProductsByStore("t1")).resolves.toEqual([
      { id: "p1", tiendaId: "t1", nombre: "Prod1", descripcion: "", precio: 3.5, foto: null },
    ]);
    await expect(storeService.createProduct({ id: "p2", tiendaId: "t1", nombre: "Nuevo", precio: 10 })).resolves.toEqual({
      id: "p2",
      tiendaId: "t1",
      nombre: "Nuevo",
      descripcion: null,
      precio: 10,
      foto: null,
    });
    await expect(storeService.updateProduct("p2", { nombre: "Edit", precio: 15 })).resolves.toEqual({
      id: "p2",
      tiendaId: "t1",
      nombre: "Edit",
      descripcion: null,
      precio: 15,
      foto: null,
    });
    await expect(storeService.deleteProduct("p2")).resolves.toBeUndefined();
  });

  it("exports and imports catalog data", async () => {
    const upsertSpy = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockImplementation((table) => {
      if (table === "tiendas") {
        return {
          select: () => Promise.resolve({ data: [{ id: "t1", nombre_origen: "Store", logo: null }], error: null }),
          upsert: upsertSpy,
        };
      }
      if (table === "productos") {
        return {
          select: () =>
            Promise.resolve({ data: [{ id: "p1", tienda_id: "t1", nombre: "Prod", descripcion: null, precio: "5", foto: null }], error: null }),
          upsert: upsertSpy,
        };
      }
      throw new Error("unexpected table");
    });

    await expect(storeService.exportCatalog()).resolves.toEqual({
      tiendas: [{ id: "t1", nombre: "Store", logo: null }],
      productos: [{ id: "p1", tiendaId: "t1", nombre: "Prod", descripcion: null, precio: 5, foto: null }],
    });

    await expect(
      storeService.importCatalog({
        tiendas: [{ id: "t1", nombre: "Nueva", logo: "logo" }],
        productos: [{ id: "p1", tiendaId: "t1", nombre: "Nuevo", descripcion: "", precio: 12, foto: null }],
      })
    ).resolves.toEqual({ ok: true });

    expect(upsertSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenNthCalledWith(
      1,
      [{ id: "t1", nombre_origen: "Nueva", logo: "logo" }],
      { onConflict: "id" }
    );
    expect(upsertSpy).toHaveBeenNthCalledWith(
      2,
      [{ id: "p1", tienda_id: "t1", nombre: "Nuevo", descripcion: null, precio: 12, foto: null }],
      { onConflict: "id" }
    );
  });
});
