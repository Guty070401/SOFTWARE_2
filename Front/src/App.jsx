import { Link, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl font-bold text-indigo-600">UFOOD</span>
          <nav className="flex gap-2">
            <Link className="pill" to="/">Login</Link>
            <Link className="pill" to="/register">Registro</Link>
            <Link className="pill" to="/choose-role">Elegir rol</Link>
          </nav>
          <div className="ml-auto flex gap-2">
            <Link className="pill" to="/customer">Cliente</Link>
            <Link className="pill" to="/courier">Repartidor</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
      <footer className="mt-10 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} UFOOD
      </footer>
    </div>
  );
}
