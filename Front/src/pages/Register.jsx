import React from "react";
import { Link } from "react-router-dom";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import withNavigate from "../oop/router/withNavigate";

export class Register extends React.Component {
  state = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    loading: false,
    error: "",
  };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u) => {
      if (u) this.props.navigate("/choose-role", { replace: true });
    });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  async onSubmit(event) {
    event.preventDefault();

    const { password, confirm } = this.state;

    const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;

    if (!passwordRule.test(password)) {
      this.setState({
        error:
          "La contraseña debe tener de 8 a 20 caracteres e incluir al menos 1 mayúscula, 1 número y 1 símbolo.",
      });
      return;
    }

    if (password !== confirm) {
      this.setState({ error: "Las contraseñas no coinciden" });
      return;
    }

    this.setState({ loading: true, error: "" });

    try {
      const payload = {
        name: this.state.name,
        email: this.state.email,
      };
      if (this.state.password) payload.password = this.state.password;
      if (this.state.phone) payload.celular = this.state.phone;

      await appState.register(payload);
      this.props.navigate?.("/choose-role", { replace: true });
    } catch (err) {
      this.setState({
        loading: false,
        error:
          err?.message || "No se pudo registrar. Intenta nuevamente.",
      });
    }
  }

  render() {
    return (
      <section className="max-w-xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-2">Crear cuenta</h1>
          <form onSubmit={(e) => this.onSubmit(e)} className="grid gap-4">

            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                className="input mt-1"
                value={this.state.name}
                onChange={(e) => this.setState({ name: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Correo</label>
                <input
                  className="input mt-1"
                  type="email"
                  value={this.state.email}
                  onChange={(e) => this.setState({ email: e.target.value })}
                  required
                  pattern="^[0-9]{8}@aloe\.ulima\.edu\.pe$"
                  title="Debe ingresar 8 dígitos antes de @aloe.ulima.edu.pe. Ejemplo: xxxxxxxx@aloe.ulima.edu.pe"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  className="input mt-1"
                  value={this.state.phone}
                  onChange={(e) => this.setState({ phone: e.target.value })}
                  inputMode="numeric"
                  maxLength={9}
                  pattern="9[0-9]{8}"
                  title="Teléfono de 9 dígitos que empieza con 9"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contraseña</label>
                <input
                  className="input mt-1"
                  type="password"
                  minLength={8}
                  maxLength={20}
                  value={this.state.password}
                  onChange={(e) => this.setState({ password: e.target.value })}
                  title="De 8 a 20 caracteres, con al menos 1 mayúscula, 1 número y 1 símbolo."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirmación</label>
                <input
                  className="input mt-1"
                  type="password"
                  minLength={8}
                  maxLength={20}
                  value={this.state.confirm}
                  onChange={(e) => this.setState({ confirm: e.target.value })}
                  required
                />
              </div>
            </div>

            {this.state.error && (
              <p className="text-sm text-red-600">{this.state.error}</p>
            )}

            <button className="btn btn-primary" disabled={this.state.loading}>
              {this.state.loading ? "Creando..." : "Registrarme"}
            </button>

            <Link
              to="/"
              className="btn w-full border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              Volver al Login
            </Link>
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(Register);
