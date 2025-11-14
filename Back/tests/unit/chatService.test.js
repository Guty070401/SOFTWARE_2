const chatService = require("../../src/services/chatService");
const { supabase } = require("../../src/data/database");

describe("chatService", () => {
  beforeEach(() => {
    supabase.from = jest.fn();
  });

  const mockEnsure = ({ exists = true, error = null, extra = {} } = {}) => {
    supabase.from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: exists ? { orden_id: "ord-1", usuario_id: "usr-1", es_repartidor: false, ...extra } : null, error }),
          }),
        }),
      }),
    }));
  };

  it("throws when user has no access", async () => {
    mockEnsure({ exists: false });
    await expect(chatService.listMessages("ord-1", "usr-x")).rejects.toMatchObject({ status: 403 });
  });

  it("lists messages ordered for authorized user", async () => {
    mockEnsure();
    supabase.from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: [
              { id: "m1", orden_id: "ord-1", usuario_id: "usr-1", rol: "customer", mensaje: "hola", creado_en: "2024-01-01" },
            ],
            error: null,
          }),
        }),
      }),
    }));

    const messages = await chatService.listMessages("ord-1", "usr-1");
    expect(messages).toEqual([
      {
        id: "m1",
        ordenId: "ord-1",
        usuarioId: "usr-1",
        rol: "customer",
        mensaje: "hola",
        createdAt: "2024-01-01",
      },
    ]);
  });

  it("sends messages assigning role", async () => {
    mockEnsure({ extra: { es_repartidor: true } });
    supabase.from.mockImplementationOnce(() => ({
      insert: (payload) => {
        expect(payload.orden_id).toBe("ord-1");
        expect(payload.usuario_id).toBe("usr-1");
        expect(payload.rol).toBe("courier");
        expect(payload.mensaje).toBe("listo");
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: { id: "msg-1", orden_id: "ord-1", usuario_id: "usr-1", rol: "courier", mensaje: "listo", creado_en: "2024-01-02" },
                error: null,
              }),
          }),
        };
      },
    }));

    const saved = await chatService.sendMessage("ord-1", "usr-1", "  listo  ");
    expect(saved).toEqual({
      id: "msg-1",
      ordenId: "ord-1",
      usuarioId: "usr-1",
      rol: "courier",
      mensaje: "listo",
      createdAt: "2024-01-02",
    });
  });

  it("validates empty message", async () => {
    await expect(chatService.sendMessage("ord-1", "usr-1", " ")).rejects.toMatchObject({ status: 400 });
  });
});
