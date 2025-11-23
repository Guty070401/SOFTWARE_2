import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { EVENTS } from "../../../src/oop/state/events.js";
import { createAppStateMock } from "../../utils/appStateMock.js";
import { Login } from "../../../src/pages/Login.jsx";
import { Register } from "../../../src/pages/Register.jsx";
import { ChooseRole } from "../../../src/pages/ChooseRole.jsx";

const appStateModule = vi.hoisted(() => ({ mock: null }));

vi.mock("../../../src/oop/state/AppState.js", () => ({
  get default(){
    return appStateModule.mock;
  },
}));

const { mock: appStateMock, listeners, reset } = createAppStateMock();
appStateModule.mock = appStateMock;

describe("Auth and role selection pages", () => {
  beforeEach(() => {
    reset();
  });

  it("logs in and redirects after auth change", async () => {
    appStateMock.login.mockResolvedValueOnce(undefined);
    const view = render(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("xxxxxxxx@ulima.edu.pe"), {
      target: { value: "user@example.com" },
    });
    const passwordInput = view.container.querySelector('input[type="password"]');
    fireEvent.change(passwordInput, {
      target: { value: "secret" },
    });
    await act(async ()=>{
      fireEvent.submit(screen.getByRole("button", { name: /Entrar/i }));
    });
    expect(appStateMock.login).toHaveBeenCalledWith("user@example.com", "secret");
    act(()=> listeners.get(EVENTS.AUTH_CHANGED)?.({ id: 1 }));
  });

  it("registers a user and navigates to choose role", async () => {
    const navigate = vi.fn();
    appStateMock.register.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <Register navigate={navigate} />
      </MemoryRouter>
    );
    const textFields = screen.getAllByRole("textbox");
    fireEvent.change(textFields[0], { target: { value: "Ada" } });
    fireEvent.change(textFields[1], { target: { value: "12345678@aloe.ulima.edu.pe" } });
    fireEvent.change(textFields[2], { target: { value: "912345678" } });
    const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
    fireEvent.change(passwordInputs[0], { target: { value: "Abcdef1!" } });
    fireEvent.change(passwordInputs[1], { target: { value: "Abcdef1!" } });
    await act(async ()=>{
      fireEvent.submit(screen.getByRole("button", { name: /Registrarme/i }));
    });
    expect(appStateMock.register).toHaveBeenCalledWith({
      name: "Ada",
      email: "12345678@aloe.ulima.edu.pe",
      password: "Abcdef1!",
      celular: "912345678",
    });
    expect(navigate).toHaveBeenCalledWith("/choose-role", { replace: true });
  });

  it("allows choosing a role and navigating accordingly", () => {
    const navigate = vi.fn();
    render(<ChooseRole navigate={navigate} />);
    const [customerBtn, courierBtn] = screen.getAllByRole("button", { name: /Continuar/i });
    fireEvent.click(customerBtn);
    fireEvent.click(courierBtn);
    expect(appStateMock.setRole).toHaveBeenNthCalledWith(1, "customer");
    expect(appStateMock.setRole).toHaveBeenNthCalledWith(2, "courier");
    expect(navigate).toHaveBeenNthCalledWith(1, "/customer", { replace: true });
    expect(navigate).toHaveBeenNthCalledWith(2, "/courier", { replace: true });
  });
});
