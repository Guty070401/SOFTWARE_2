import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Login from "../../src/pages/Login";
import appState from "../../src/oop/state/AppState";
import { EVENTS } from "../../src/oop/state/events";

// --- MOCKS DE appState.login Y EVENTOS ---
vi.mock("../../src/oop/state/AppState", () => ({
  default: {
    login: vi.fn(),
    on: vi.fn((event, cb) => {
      // Guardamos el callback para dispararlo manualmente
      loginMockHelpers.subscriber = cb;
      return () => {};
    }),
  },
}));

// Helper para manejar eventos AUTH_CHANGED
const loginMockHelpers = {
  subscriber: null,
  emitAuthChanged(user) {
    this.subscriber && this.subscriber(user);
  },
  reset() {
    appState.login.mockReset();
    this.subscriber = null;
  },
};

describe("Login page (integration)", () => {
  beforeEach(() => {
    loginMockHelpers.reset();
  });

  afterEach(() => {
    cleanup();
  });

  it("permite iniciar sesión con credenciales correctas", async () => {
    const user = userEvent.setup();
    appState.login.mockResolvedValueOnce({ id: 1, name: "Tester" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Escribir email
    await user.type(
      screen.getByPlaceholderText("xxxxxxxx@ulima.edu.pe"),
      "test@test.com"
    );

    // Escribir password
    await user.type(
      screen.getByPlaceholderText("********"),
      "123456"
    );

    // Enviar formulario
    await user.click(
      screen.getByRole("button", { name: "Entrar" })
    );

    // Se haya llamado appState.login con los parámetros correctos
    expect(appState.login).toHaveBeenCalledWith("test@test.com", "123456");

    // Simular evento AUTH_CHANGED despachado por appState
    loginMockHelpers.emitAuthChanged({ id: 1, name: "Tester" });

    // Ahora debe detectar que logged === true y navegar
    expect(screen.queryByText("Ingresar")).not.toBeInTheDocument();
  });

  it("muestra error cuando las credenciales son incorrectas", async () => {
    const user = userEvent.setup();
    appState.login.mockRejectedValueOnce(new Error("Credenciales incorrectas"));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText("xxxxxxxx@ulima.edu.pe"),
      "wrong@test.com"
    );

    await user.type(
      screen.getByPlaceholderText("********"),
      "badpass"
    );

    await user.click(
      screen.getByRole("button", { name: "Entrar" })
    );

    expect(await screen.findByText("Credenciales incorrectas")).toBeInTheDocument();
  });
});
