import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function Register(){
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  function onSubmit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login({ id: "2", name: form.get("name"), role: null });
    navigate("/choose-role");
  }

  return (
    <section className="max-w-xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-2">Crear cuenta</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input name="name" className="input mt-1" required/>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Correo</label>
              <input name="email" type="email" className="input mt-1" required/>
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <input name="phone" className="input mt-1" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <input name="pass" type="password" className="input mt-1" required/>
            </div>
            <div>
              <label className="text-sm font-medium">Confirmación</label>
              <input name="pass2" type="password" className="input mt-1" required/>
            </div>
          </div>
          <button className="btn btn-primary">Registrarme</button>
        </form>
      </div>
    </section>
  );
}
