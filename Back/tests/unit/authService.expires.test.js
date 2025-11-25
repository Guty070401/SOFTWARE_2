const { _resolveJwtExpires } = require("../../src/services/authService");

describe("resolveJwtExpires", () => {
  it("uses fallback when value is placeholder", () => {
    expect(_resolveJwtExpires("${JWT_EXPIRES:-1h}")).toBe("24h");
  });

  it("keeps valid timespan", () => {
    expect(_resolveJwtExpires("2h")).toBe("2h");
  });

  it("falls back when format is invalid", () => {
    expect(_resolveJwtExpires("not-a-duration")).toBe("24h");
  });
});
