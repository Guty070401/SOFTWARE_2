import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import appState from "./oop/state/AppState.js";
import { EVENTS } from "./oop/state/events.js";
if (typeof window !== "undefined") {
  window.appState = appState;
}
function HeaderBar({ user, onLogout }) {
  const { pathname } = useLocation();

  // Ocultar Login/Registro en "/", "/login" y "/register"
  const hideAuthButtons =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  // Ocultar "Cambiar rol" en todo el flujo de cliente y en detalles de courier
  const hideChangeRole =
    // públicas / auth
    pathname.startsWith("/choose-role") ||
    // cliente
    pathname.startsWith("/customer/cart") ||
    pathname.startsWith("/customer/checkout") ||
    pathname.startsWith("/customer/orders") ||
    pathname.startsWith("/customer/track") ||
    pathname.startsWith("/customer/order") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order") ||
    // courier (detalle/seguimiento de pedidos)
    pathname.startsWith("/courier/order") ||     // /courier/orders/:id o /courier/order-detail
    pathname.startsWith("/courier/orders") ||    // listado de pedidos del courier
    pathname.startsWith("/courier/track");       // seguimiento courier (si aplica)

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          UFOOD
        </Link>

        {!user && !hideAuthButtons && (
          <nav className="flex gap-2 ml-auto">
            <Link className="pill" to="/login">Login</Link>
            <Link className="pill" to="/register">Registro</Link>
          </nav>
        )}

        {user && (
          <div className="flex gap-2 ml-auto items-center">
            {!hideChangeRole && (
              <Link className="pill" to="/choose-role">Cambiar rol</Link>
            )}
            <button
              className="pill bg-red-500 text-white hover:bg-red-600"
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
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) => this.setState({ user: u }));
    this.setState({ user: appState.user });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  logout() {
    appState.logout && appState.logout();
    window.location.href = "/"; // redirige al login
  }
  
  render() {
    const { user } = this.state;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* Header que se adapta por ruta */}
        <HeaderBar user={user} onLogout={() => this.logout()} />

        {/* Contenido dinámico */}
        <main className="mx-auto max-w-6xl p-4">
          <Outlet />
        </main>
      </div>
    );
  }
  
}
