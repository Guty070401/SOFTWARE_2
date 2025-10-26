import React from "react";
import appState from "../oop/state/AppState";
import { EVENTS } from "../oop/state/events";
import withNavigate from "../oop/router/withNavigate";

class Register extends React.Component {
  state = { name: "", email: "", done: false, loading: false };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.AUTH_CHANGED, (u)=> { if (u) this.setState({ done: true }); });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  async onSubmit(e){
    e.preventDefault();
    this.setState({ loading: true });
    await appState.register({ name: this.state.name, email: this.state.email });
    this.setState({ loading: false });
    this.props.navigate("/choose-role", { replace: true });
  }

  render(){
    return (
      <section className="max-w-xl mx-auto">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-2">Crear cuenta</h1>
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
                <input className="input mt-1" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contraseña</label>
              <input className="input mt-1" type="password" required/>
              </div>
              <div>
                <label className="text-sm font-medium">Confirmación</label>
                <input className="input mt-1" type="password" required/>
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
