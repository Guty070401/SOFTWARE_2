import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../../../src/components/Header.jsx";

const { mockLogout } = vi.hoisted(()=> ({
  mockLogout: vi.fn(),
}));

vi.mock("../../../src/oop/state/AppState.js", () => ({
  default: {
    logout: mockLogout,
  },
}));

describe("Header component", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("renders auth links when user is not authenticated and path allows it", () => {
    render(
      <MemoryRouter initialEntries={["/customer/home"]}>
        <Header user={null} />
      </MemoryRouter>
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Registro")).toBeInTheDocument();
  });

  it("shows greeting and triggers logout for authenticated users", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Header user={{ name: "Ada" }} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Cerrar/ }));
    expect(mockLogout).toHaveBeenCalled();
  });
});
