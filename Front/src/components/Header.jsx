import React from "react";
import appState from "../oop/state/AppState.js";

function Header({ user }) {
  return (
    <header
      className="flex justify-between items-center px-6 py-3 bg-gray-900 text-white shadow-md"
    >
      <h1 className="text-xl font-bold">Mi App</h1>
      {!user ? (
        <nav className="flex gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Login
          </button>
          <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
            Registro
          </button>
        </nav>
      ) : (
        <nav className="flex gap-3 items-center">
          <span>Hola, {user.name || "Usuario"}</span>
          <button
            onClick={() => appState.logout()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}

export default Header;
