import React from "react";
import appState from "../oop/state/AppState.js";
import { EVENTS } from "../oop/state/events.js";
import withNavigate from "../oop/router/withNavigate";

class Register extends React.Component {
  state = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    done: false,
    loading: false,
    error: null
  };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u)=> {
      if (u) this.setState({ done: true, loading: false });
    });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  async onSubmit(e){
    e.preventDefault();
    if (this.state.loading) return;
    if (this.state.password !== this.state.confirm) {
      this.setState({ error: "Las contraseñas no coinciden." });
      return;
    }
    this.setState({ loading: true, error: null });
    try {
      await appState.register({
        name: this.state.name,
        email: this.state.email,
        password: this.state.password,
        phone: this.state.phone
      });
      this.props.navigate("/choose-role", { replace: true });
    } catch (error) {
      const message = error?.message || 'No se pudo completar el registro.';
      this.setState({ error: message });
    } finally {
      this.setState({ loading: false });
    }
  }

  render(){
    return (
      <section className="max-w-xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-2">Crear cuenta</h1>
          {this.state.error && (
            <div className="p-3 rounded bg-rose-100 text-rose-700 text-sm">
              {this.state.error}
            </div>
          )}
          <form onSubmit={(e)=>this.onSubmit(e)} className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input className="input mt-1" value={this.state.name} onChange={(e)=>this.setState({ name: e.target.value })} required/>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Correo</label>
                <input className="input mt-1" type="email" value={this.state.email} onChange={(e)=>this.setState({ email: e.target.value })} required/>
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <input className="input mt-1" type="tel" value={this.state.phone} onChange={(e)=>this.setState({ phone: e.target.value })}/>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contraseña</label>
              <input className="input mt-1" type="password" value={this.state.password} onChange={(e)=>this.setState({ password: e.target.value })} required/>
              </div>
              <div>
                <label className="text-sm font-medium">Confirmación</label>
                <input className="input mt-1" type="password" value={this.state.confirm} onChange={(e)=>this.setState({ confirm: e.target.value })} required/>
              </div>
            </div>
            <button className="btn btn-primary" disabled={this.state.loading}>
              {this.state.loading ? "Creando..." : "Registrarme"}
            </button>
          </form>
        </div>
      </section>
    );
  }
}

export default withNavigate(Register);
