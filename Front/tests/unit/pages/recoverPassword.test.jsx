import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const changePasswordMock = vi.fn();
vi.mock("../../src/services/authService", () => ({
  changePassword: changePasswordMock,
}));

import RecoverPassword from "@/pages/RecoverPassword.jsx";

describe.skip("RecoverPassword page (manual)", () => {
  beforeEach(() => {
    changePasswordMock.mockReset();
    navigateMock.mockReset();
    global.alert = vi.fn();
  });

  const fillPasswords = (values) => {
    const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
    inputs.forEach((input, idx) => {
      const val = values[idx] ?? "";
      fireEvent.change(input, { target: { value: val } });
    });
  };

  it("valida campos, cambia contrasena y redirige", async () => {
    changePasswordMock.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <RecoverPassword />
      </MemoryRouter>
    );

    fillPasswords(["old", "newpass", "newpass"]);

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /Guardar cambios/i }));
    });

    expect(changePasswordMock).toHaveBeenCalledWith({ oldPassword: "old", newPassword: "newpass" });
    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/actualizada/i));
    expect(navigateMock).toHaveBeenCalledWith("/customer");
  });

  it("muestra errores de validacion y errores del backend", async () => {
    changePasswordMock.mockRejectedValueOnce(new Error("fail"));
    render(
      <MemoryRouter>
        <RecoverPassword />
      </MemoryRouter>
    );

    // validacion: faltan campos
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /Guardar cambios/i }));
    });
    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Completa/i));

    global.alert.mockClear();
    fillPasswords(["old", "short", "short"]);
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /Guardar cambios/i }));
    });
    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/al menos 6/i));

    global.alert.mockClear();
    fillPasswords(["old", "newpass", "other"]);
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /Guardar cambios/i }));
    });
    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/confirmaci/i));

    global.alert.mockClear();
    fillPasswords(["old", "newpass", "newpass"]);
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: /Guardar cambios/i }));
    });
    expect(changePasswordMock).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/No se pudo cambiar/i));
  });
});
