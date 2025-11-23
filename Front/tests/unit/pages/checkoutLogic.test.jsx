import { describe, it, expect, vi, beforeEach } from "vitest";
import { Checkout } from "@/pages/Customer/Checkout.jsx";

const controller = {
  getState: vi.fn(() => ({ total: 10, error: "", paying: false })),
  subscribe: vi.fn((cb) => {
    cb({ total: 10, error: "", paying: false });
    return vi.fn();
  }),
  initialize: vi.fn(),
  pay: vi.fn(),
};

vi.mock("../../src/oop/controllers/CheckoutController.js", () => ({
  default: { getInstance: () => controller },
}));

const navigateMock = vi.fn();

const build = (state = {}) => {
  const instance = new Checkout({ navigate: navigateMock, location: { state: { total: 10 } } });
  instance.state = { ...instance.state, ...state };
  instance.setState = (update, cb) => {
    const patch = typeof update === "function" ? update(instance.state) : update;
    instance.state = { ...instance.state, ...patch };
    cb?.();
  };
  return instance;
};

describe("Checkout component logic", () => {
  beforeEach(() => {
    Object.values(controller).forEach((fn) => fn.mockClear?.());
    navigateMock.mockReset();
  });

  it("formatea y valida datos de tarjeta", () => {
    const comp = build();
    comp.handleSaveCardDetails();
    expect(comp.state.detailsError).toMatch(/Completa/i);

    comp.handleCardInputChange("cardNumber", "1234567890123456");
    comp.handleCardInputChange("mm", "12");
    comp.handleCardInputChange("yy", "34");
    comp.handleCardInputChange("cvv", "999");
    comp.handleCardInputChange("cardName", "Ada");
    comp.handleSaveCardDetails();
    expect(comp.state.savedDetails.card?.method).toBe("card");
    expect(comp.state.showCardModal).toBe(false);
  });

  it("guarda y limpia datos de efectivo", () => {
    const comp = build({ paymentMethod: "cash" });
    comp.handleSaveCashDetails();
    expect(comp.state.detailsError).toMatch(/monto/i);
    comp.handleCashInputChange("amount", "25");
    comp.handleCashInputChange("notes", "vuelto");
    comp.handleSaveCashDetails();
    expect(comp.state.savedDetails.cash?.method).toBe("cash");
    comp.handleEditCashDetails();
    expect(comp.state.savedDetails.cash).toBeNull();
  });

  it("envia pay con paymentDetails nulos cuando no hay datos", async () => {
    const comp = build({ paymentMethod: "card", savedDetails: { card: null, cash: null } });
    const paySpy = vi.fn();
    comp.controller = { ...controller, pay: paySpy };
    await comp.handlePay({ preventDefault: () => {} });
    expect(paySpy).toHaveBeenCalledWith(expect.objectContaining({ paymentDetails: null }));
  });
});
