import React from "react";
import { useLocation, Link } from "react-router-dom";
import appState from "../oop/state/AppState.js";

function Header({ user }) {
  const { pathname } = useLocation();

  // Ocultar botones en "/", "/login" y "/register"
  const hideAuthButtons =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  return (
    <header className="flex justify-between items-center px-6 py-3 bg-white text-slate-900 border-b">
      <span className="text-2xl font-extrabold text-indigo-600 select-none cursor-default">
        UFOOD
      </span>

      {!user && !hideAuthButtons && (
        <nav className="flex gap-2">
          <Link
            to="/login"
            className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Registro
          </Link>
        </nav>
      )}

      {user && (
        <nav className="flex gap-3 items-center">
          <span>Hola, {user?.name || "Usuario"}</span>
          <button
            onClick={() => appState.logout()}
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}

export default Header;
