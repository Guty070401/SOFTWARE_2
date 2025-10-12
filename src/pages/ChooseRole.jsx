import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ChooseRole(){
  const setRole = useAuthStore(s => s.setRole);
  const navigate = useNavigate();

  return (
    <section className="grid md:grid-cols-2 gap-6">
      <div className="card flex flex-col items-start">
        <h2 className="text-xl font-semibold">Soy Cliente</h2>
        <p className="text-slate-500 mt-1">Explora el menú, arma tu carrito y sigue tu pedido.</p>
        <button
          onClick={() => { setRole("customer"); navigate("/customer"); }}
          className="btn btn-primary mt-4"
        >Continuar</button>
      </div>
      <div className="card flex flex-col items-start">
        <h2 className="text-xl font-semibold">Soy Repartidor</h2>
        <p className="text-slate-500 mt-1">Ve pedidos asignados y actualiza su estado.</p>
        <button
          onClick={() => { setRole("courier"); navigate("/courier"); }}
          className="btn mt-4"
        >Continuar</button>
      </div>
    </section>
  );
}
