import React from "react";
import { Link, Navigate } from "react-router-dom";
import appState from "../oop/state/AppState.js";
import { EVENTS } from "../oop/state/events.js";

export default class Login extends React.Component {
  state = { email: "", pass: "", logged: false, loading: false, error: null };

  componentDidMount() {
    // Escucha cambios en la autenticación
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) => {
      this.setState({ logged: !!u, loading: false });
    });
    if (appState.user) {
      this.setState({ logged: true });
    }
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  async onSubmit(e) {
    e.preventDefault();
    if (this.state.loading) return;
    this.setState({ loading: true, error: null });
    try {
      await appState.login(this.state.email, this.state.pass);
    } catch (error) {
      const message = error?.message || 'No se pudo iniciar sesión.';
      this.setState({ error: message, loading: false });
    }
  }

  render() {
    // Si el usuario ya está logueado, lo redirige
    if (this.state.logged) return <Navigate to="/choose-role" replace />;

    return (
      <section className="grid md:grid-cols-2 gap-6 items-center">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-2">Ingresar</h1>
          {this.state.error && (
            <div className="p-3 rounded bg-rose-100 text-rose-700 text-sm">
              {this.state.error}
            </div>
          )}
          <form onSubmit={(e) => this.onSubmit(e)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Correo</label>
              <input
                className="input mt-1"
                value={this.state.email}
                onChange={(e) => this.setState({ email: e.target.value })}
                type="email"
                required
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <input
                className="input mt-1"
                value={this.state.pass}
                onChange={(e) => this.setState({ pass: e.target.value })}
                type="password"
                required
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary w-full" disabled={this.state.loading}>
              {this.state.loading ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-sm text-slate-500 mt-4">
            ¿No tienes cuenta?{" "}
            <Link className="text-indigo-600 hover:underline" to="/register">
              Regístrate
            </Link>
          </p>
        </div>
        <div className="hidden md:block">
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Bienvenido a UFOOD</h2>
              <p className="text-slate-500 mt-2">
                Pide, sigue tu pedido y recibe en minutos.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
