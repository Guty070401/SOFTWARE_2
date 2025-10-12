import { Link } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";

const ITEMS = [
  { id:"p1", name:"Hamburguesa Clásica", price:18, desc:"Carne 120g, queso, lechuga" },
  { id:"p2", name:"Pizza Pepperoni", price:28, desc:"8 porciones, masa delgada" },
  { id:"p3", name:"Pollo Broaster", price:24, desc:"1/4 pollo + papas" },
];

export default function CustomerHome(){
  const addToCart = useOrderStore(s => s.addToCart);

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Menú</h1>
          <p className="text-slate-500">Elige tus platos favoritos</p>
        </div>
        <Link to="/customer/cart" className="pill">Ver carrito</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ITEMS.map(it => (
          <div key={it.id} className="card flex flex-col">
            <div className="h-28 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl mb-3" />
            <div className="flex-1">
              <h3 className="font-semibold">{it.name}</h3>
              <p className="text-sm text-slate-500">{it.desc}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold">S/ {it.price}</span>
              <button className="btn btn-primary"
                onClick={() => addToCart({ ...it, qty:1 })}
              >Agregar</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
