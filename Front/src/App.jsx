import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import appState from "./oop/state/AppState.js";
import { EVENTS } from "./oop/state/events.js";

if (typeof window !== "undefined") {
  window.appState = appState;
}

/* ================== Header ================== */

export function HeaderBar({ user, onLogout }) {
  const { pathname } = useLocation();
  const menuRef = useRef(null);

  const hideAuthButtons =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const hideUserMenu = pathname.startsWith("/choose-role");

  const role = appState.user?.role;
  const roleLetter =
    role === "customer" ? "C" :
    role === "courier"  ? "R" :
    (appState.user?.name?.[0] || "U").toUpperCase();

  // Evitar dropdowns en tests y mantener acciones visibles
  useEffect(() => {
    // Conservamos el ref para futura compatibilidad
    menuRef.current = menuRef.current;
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="relative mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl font-bold text-indigo-600 select-none cursor-default">
          UFOOD
        </span>

        {!user && !hideAuthButtons && (
          <nav className="flex gap-2 ml-auto">
            <Link className="pill" to="/login">Login</Link>
            <Link className="pill" to="/register">Registro</Link>
          </nav>
        )}

        {user && !hideUserMenu && (
          <div className="flex gap-3 ml-auto items-center" ref={menuRef}>
            <span className="text-sm text-slate-600">{user.name || "Usuario"}</span>
            {pathname.startsWith("/courier") ? null : (
              <Link className="pill" to="/choose-role">Cambiar rol</Link>
            )}
            <Link className="pill" to="/account/change-password">Cambiar contraseña</Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default class App extends React.Component {
  state = { user: null };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) =>
      this.setState({ user: u })
    );
    this.setState({ user: appState.user });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  logout() {
    appState.logout && appState.logout();
    window.location.href = "/";
  }

  render() {
    const { user } = this.state;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <HeaderBar user={user} onLogout={() => this.logout()} />
        <main className="mx-auto max-w-6xl p-4">
          <Outlet />
        </main>
      </div>
    );
  }
}