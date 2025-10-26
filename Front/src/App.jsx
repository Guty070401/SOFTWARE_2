import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import appState from "./oop/state/AppState.js";
import { EVENTS } from "./oop/state/events.js";

export default class App extends React.Component {
  state = { user: null };

  componentDidMount() {
    // Escuchar cambios de sesión (login / logout)
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) => this.setState({ user: u }));
    this.setState({ user: appState.user });
    appState.restoreSession()?.catch?.(() => {});
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  logout() {
    appState.logout && appState.logout();
    // 🔹 Redirigir al login
    window.location.href = "/";
  }

  render() {
    const { user } = this.state;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* 🔹 HEADER ADAPTABLE */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl font-bold text-indigo-600">UFOOD</span>

            {/* Si el usuario NO está logueado */}
            {!user ? (
              <nav className="flex gap-2 ml-auto">
                <Link className="pill" to="/">Login</Link>
                <Link className="pill" to="/register">Registro</Link>
              </nav>
            ) : (
              // Si el usuario SÍ está logueado
              <div className="flex gap-2 ml-auto items-center">
                <Link className="pill" to="/choose-role">Elegir rol</Link>
                <button
                  className="pill bg-red-500 text-white hover:bg-red-600"
                  onClick={() => this.logout()}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 🔹 Contenido dinámico */}
        <main className="mx-auto max-w-6xl p-4">
          <Outlet />
        </main>
      </div>
    );
  }
}
