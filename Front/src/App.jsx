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
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const hideAuthButtons =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const hideUserMenu = pathname.startsWith("/choose-role");

  // ================================
  // 📌 DATOS DEL USUARIO
  // ================================
  const fullName =
    user?.nombre ||
    user?.nombre_completo ||
    user?.fullName ||
    user?.name ||
    "Usuario";

  const email =
    user?.correo ||
    user?.email ||
    user?.user?.email ||
    user?.user?.correo ||
    "";

  const role = user?.role || "customer";
  const roleLetter = fullName.charAt(0).toUpperCase();

  // ================================
  // Cerrar menú al hacer click afuera
  // ================================
  useEffect(() => {
    function handleClickOutside(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="relative mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl font-bold text-indigo-600 select-none cursor-default">
          UFOOD
        </span>

        {/* BOTONES LOGIN / REGISTRO */}
        {!user && !hideAuthButtons && (
          <nav className="flex gap-2 ml-auto">
            <Link className="pill" to="/">Login</Link>
            <Link className="pill" to="/register">Registro</Link>
          </nav>
        )}

        {/* MENU DE USUARIO */}
        {user && !hideUserMenu && (
          <div className="flex gap-2 ml-auto items-center" ref={menuRef}>

            {/* Botón del menú (círculo con inicial) */}
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen(v => !v)}
              className={`h-9 w-9 rounded-full text-white grid place-items-center font-bold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                role === "courier" ? "bg-emerald-600" : "bg-indigo-600"
              }`}
              title={role === "courier" ? "Repartidor" : "Cliente"}
            >
              {roleLetter}
            </button>

            {/* Dropdown */}
            {open && (
              <div
                role="menu"
                className="absolute right-4 top-14 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
              >
                {/* Datos del usuario */}
                <div className="px-4 py-3 border-b border-slate-200">
                  <div className="font-semibold text-slate-900">{fullName}</div>
                  <div className="text-xs text-slate-500">{email}</div>
                </div>

                {/* Cambiar rol */}
                <Link
                  to="/choose-role"
                  role="menuitem"
                  className="block px-4 py-3 hover:bg-slate-50 text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Cambiar rol
                </Link>

                {/* Cambiar contraseña */}
                <Link
                  to="/recoverPassword"
                  role="menuitem"
                  className="block px-4 py-3 hover:bg-slate-50 text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Cambiar contraseña
                </Link>

                {/* Cerrar sesión */}
                <button
                  role="menuitem"
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-red-600"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* ================== APP ROOT ================== */
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
