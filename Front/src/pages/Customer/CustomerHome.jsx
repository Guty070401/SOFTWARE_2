import React from "react";
import { Link } from "react-router-dom";
import appState from "../../oop/state/AppState";
import Item from "../../oop/models/Item";
import { EVENTS } from "../../oop/state/events";

const ITEMS = [
  new Item("p1","Hamburguesa Clásica",18,"Carne 120g, queso, lechuga"),
  new Item("p2","Pizza Pepperoni",28,"8 porciones, masa delgada"),
  new Item("p3","Pollo Broaster",24,"1/4 pollo + papas"),
];

export default class CustomerHome extends React.Component {
  state = { cartCount: 0 };

  componentDidMount(){
    this.unsub = appState.on(EVENTS.CART_CHANGED, (c)=> this.setState({ cartCount: c.length }));
    this.setState({ cartCount: appState.cart.length });
  }
  componentWillUnmount(){ this.unsub && this.unsub(); }

  addToCart(item){ appState.addToCart(item); }

  render(){
    return (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Menú</h1>
            <p className="text-slate-500">Elige tus platos favoritos</p>
          </div>
          <Link to="/customer/cart" className="pill">Carrito ({this.state.cartCount})</Link>
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
                <button className="btn btn-primary" onClick={()=>this.addToCart(new Item(it.id,it.name,it.price,it.desc,1))}>Agregar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
}
