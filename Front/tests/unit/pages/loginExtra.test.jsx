import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const appStateMock = {
  login: vi.fn(),
  on: vi.fn(() => vi.fn()),
};
vi.mock("../../src/oop/state/AppState.js", () => ({
  default: appStateMock,
}));

import { Login } from "@/pages/Login.jsx";

describe.skip("Login page", () => {
  beforeEach(() => {
    appStateMock.login.mockReset();
  });

  it("muestra error cuando login falla", async () => {
    appStateMock.login.mockRejectedValueOnce(new Error("fail"));
    const view = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const form = view.container.querySelector("form");
    fireEvent.change(screen.getByPlaceholderText(/xxxxxxxx@ulima/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("********"), { target: { value: "pass" } });
    await act(async () => {
      fireEvent.submit(form);
    });
    await vi.waitFor(() => expect(appStateMock.login).toHaveBeenCalledWith("user@example.com", "pass"));
    expect(screen.getByText(/No se pudo iniciar/i)).toBeInTheDocument();
  });
});
