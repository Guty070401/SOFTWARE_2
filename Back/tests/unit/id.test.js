const { generateId } = require("../../src/utils/id");

describe("generateId", () => {
  it("generates unique ids with prefix", () => {
    const ids = new Set();
    for (let i = 0; i < 5; i += 1) {
      ids.add(generateId("ord_"));
    }
    expect(ids.size).toBe(5);
    ids.forEach((id) => expect(id.startsWith("ord_")).toBe(true));
  });
});
