import React from "react";
import appState from "../oop/state/AppState";

export default function RecoverPassword() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // Simulación: solo validar que existe un login
      await appState.login(email, "dummy");

      setMessage("Si el correo existe, se enviará un enlace de recuperación.");
    } catch (err) {
      setMessage("Si el correo existe, se enviará un enlace de recuperación.");
    }
  }

  return (
    <section className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Recuperar contraseña</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="input"
          placeholder="Ingresa tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <button className="btn btn-primary w-full">Enviar enlace</button>
      </form>

      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </section>
  );
}
