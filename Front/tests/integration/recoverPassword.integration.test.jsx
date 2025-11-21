import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecoverPassword from "../../src/pages/RecoverPassword";
import appState from "../../src/oop/state/AppState";

vi.mock("../../src/oop/state/AppState", () => ({
  default: {
    login: vi.fn(),
  },
}));

describe("Recover Password (integration)", () => {
  beforeEach(() => {
    appState.login.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("envía enlace de recuperación", async () => {
    const user = userEvent.setup();
    appState.login.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <RecoverPassword />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText("Ingresa tu correo"),
      "user@test.com"
    );

    await user.click(
      screen.getByRole("button", { name: "Enviar enlace" })
    );

    expect(appState.login).toHaveBeenCalled();

    expect(
      await screen.findByText(/se enviará un enlace/i)
    ).toBeInTheDocument();
  });
});
