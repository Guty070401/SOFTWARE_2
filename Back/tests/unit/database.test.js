let createClientMock;

const loadDatabaseModule = () => {
  let exported;
  jest.isolateModules(() => {
    jest.doMock("dotenv", () => ({ config: jest.fn() }));
    jest.doMock("@supabase/supabase-js", () => {
      createClientMock = jest.fn(() => ({ client: true }));
      return { createClient: createClientMock };
    });
    exported = require("../../src/data/database");
  });
  return exported;
};

describe("data/database bootstrap", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws helpful error when env vars are missing", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE;

    expect(() => loadDatabaseModule()).toThrow(/Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE/);
  });

  it("creates supabase client with provided credentials", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE = "service-token";

    const { supabase } = loadDatabaseModule();
    expect(createClientMock).toHaveBeenCalledWith("https://example.supabase.co", "service-token", {
      auth: { persistSession: false },
    });
    expect(supabase).toEqual({ client: true });
  });
});
