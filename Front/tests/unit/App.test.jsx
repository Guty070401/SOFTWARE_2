import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import App, { HeaderBar } from "../../src/App.jsx";
import { EVENTS } from "../../src/oop/state/events.js";

const { listeners, mockAppState } = vi.hoisted(()=> {
  const listeners = new Map();
  const mockAppState = {
    user: null,
    on: vi.fn((event, cb)=> {
      listeners.set(event, cb);
      return ()=> listeners.delete(event);
    }),
    logout: vi.fn(),
  };
  return { listeners, mockAppState };
});

vi.mock("../../src/oop/state/AppState.js", () => ({
  default: mockAppState,
}));

describe("HeaderBar and App integration", () => {
  beforeEach(() => {
    listeners.clear();
    mockAppState.user = null;
    mockAppState.on.mockClear();
    mockAppState.logout.mockClear();
  });

  it("shows login/register buttons when unauthenticated and path allows it", () => {
    render(
      <MemoryRouter initialEntries={["/customer/home"]}>
        <HeaderBar user={null} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Registro")).toBeInTheDocument();
  });

  it("hides change role for courier specific paths", () => {
    render(
      <MemoryRouter initialEntries={["/courier/order/1"]}>
        <HeaderBar user={{ name: "Tester" }} onLogout={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByText("Cambiar rol")).not.toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("reacts to auth events and triggers logout", () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: "http://localhost" };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const authListener = listeners.get(EVENTS.AUTH_CHANGED);
    expect(authListener).toBeInstanceOf(Function);
    act(()=> authListener({ name: "Alice" }));
    fireEvent.click(screen.getByText("Cerrar sesión"));
    expect(mockAppState.logout).toHaveBeenCalled();
    expect(window.location.href).toBe("/");

    window.location = originalLocation;
  });
});
