const { generateId } = require("../../src/utils/id");

describe("generateId (integration)", () => {
  it("covers prefix and default branch", () => {
    const withPrefix = generateId("int_");
    const withoutPrefix = generateId();
    expect(withPrefix.startsWith("int_")).toBe(true);
    expect(withoutPrefix.startsWith("int_")).toBe(false);
    expect(withPrefix).not.toBe(withoutPrefix);
  });
});
