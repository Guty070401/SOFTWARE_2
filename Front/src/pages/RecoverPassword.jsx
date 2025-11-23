/* istanbul ignore file */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/authService";

export default function RecoverPassword() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Completa todos los campos.");
      return;
    }

    if (newPassword.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ oldPassword, newPassword });
      alert("Contraseña actualizada correctamente.");
      navigate("/customer"); // o a donde quieras llevarlo después
    } catch (err) {
      console.error(err);
      alert("No se pudo cambiar la contraseña. Verifica la contraseña actual.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-xl font-semibold mb-1">Cambiar contraseña</h1>
        <p className="text-sm text-slate-500 mb-4">
          Actualiza tu contraseña de acceso a UFOOD.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
