import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../../src/store/useAuthStore.js";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("logs in, sets role, and logs out", () => {
    useAuthStore.getState().login({ id: 1, name: "Ada", role: "customer" });
    expect(useAuthStore.getState().user?.name).toBe("Ada");
    useAuthStore.getState().setRole("courier");
    expect(useAuthStore.getState().user?.role).toBe("courier");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
