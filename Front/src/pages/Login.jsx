import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  function handleSubmit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    login({ id: "1", name: email.split("@")[0] || "Usuario", role: null });
    navigate("/choose-role");
  }

  return (
    <section className="grid md:grid-cols-2 gap-6 items-center">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-2">Ingresar</h1>
        <p className="text-sm text-slate-500 mb-6">Accede para continuar.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Correo</label>
            <input name="email" type="email" required className="input mt-1" placeholder="tucorreo@ejemplo.com"/>
          </div>
          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input name="password" type="password" required className="input mt-1" placeholder="••••••••"/>
          </div>
          <button className="btn btn-primary w-full">Entrar</button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          ¿No tienes cuenta? <Link className="text-indigo-600 hover:underline" to="/register">Regístrate</Link>
        </p>
      </div>
      <div className="hidden md:block">
        <div className="card h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Bienvenido a UFOOD</h2>
            <p className="text-slate-500 mt-2">Pide, sigue tu pedido y recibe en minutos.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
