import React from "react";
import { Link, Navigate } from "react-router-dom";
import appState from "../oop/state/AppState.js";
import { EVENTS } from "../oop/state/events.js";
import mascotaImg from "../assets/images/mascota.jpg"; // 👈 tu imagen

export default class Login extends React.Component {
  state = { email: "", pass: "", logged: false };

  componentDidMount() {
    // Escucha cambios en la autenticación
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) => {
      if (u) this.setState({ logged: true });
    });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  async onSubmit(e) {
    e.preventDefault();
    // Inicia sesión con el estado actual
    await appState.login(this.state.email, this.state.pass);
  }

  render() {
    // Si el usuario ya está logueado, lo redirige
    if (this.state.logged) return <Navigate to="/choose-role" replace />;

    return (
      <section className="grid md:grid-cols-2 gap-6 items-center">
        {/* Columna izquierda: formulario */}
        <div className="card">
          <h1 className="text-2xl font-semibold mb-2">Ingresar</h1>
          <form onSubmit={(e) => this.onSubmit(e)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Correo</label>
              <input
                className="input mt-1"
                value={this.state.email}
                onChange={(e) => this.setState({ email: e.target.value })}
                type="email"
                required
                placeholder="xxxxxxxx@ulima.edu.pe"
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
            <button className="btn btn-primary w-full">Entrar</button>
          </form>
          <p className="text-sm text-slate-500 mt-4">
            ¿No tienes cuenta?{" "}
            <Link className="text-indigo-600 hover:underline" to="/register">
              Regístrate
            </Link>
          </p>
        </div>

        {/* Columna derecha: texto + imagen */}
        <div className="hidden md:block">
          <div className="card h-full flex flex-col items-center justify-center text-center gap-6">
            <div>
              <h2 className="text-3xl font-bold">Bienvenido a UFOOD</h2>
              <p className="text-slate-500 mt-2">
                Pide, sigue tu pedido y recibe en minutos.
              </p>
            </div>

            <img
              src={mascotaImg}
              alt="Repartidor UFOOD"
              className="w-56 md:w-64 max-w-full object-contain mx-auto"
            />
          </div>
        </div>
      </section>
    );
  }
}
