import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import User from "../oop/models/User";
import { verifyEmailToken } from "../services/authService";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "pending", message: "Verificando..." });

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState({ status: "error", message: "Token faltante o invalido." });
      return;
    }
    verifyEmailToken(token)
      .then((user) => {
        const u = new User(user.id, user.nombre || user.nombre_usuario || "", user.rol || null, user.correo || "");
        appState.user = u;
        appState.emit(EVENTS.AUTH_CHANGED, u);
        setState({ status: "ok", message: "Correo verificado correctamente. Redirigiendo al login..." });
        setTimeout(() => navigate("/", { replace: true }), 1200);
      })
      .catch((err) => {
        setState({ status: "error", message: err?.message || "No se pudo verificar el correo." });
      });
  }, [params, navigate]);

  const isOk = state.status === "ok";
  const isError = state.status === "error";

  return (
    <section className="max-w-lg mx-auto text-center">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-2">Verificar correo</h1>
        <p className={isError ? "text-red-600" : "text-slate-700"}>{state.message}</p>
        {isOk && (
          <button className="btn btn-primary mt-4" onClick={() => navigate("/", { replace: true })}>
            Ir al login
          </button>
        )}
      </div>
    </section>
  );
}
