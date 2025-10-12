import React from "react";
import { Link } from "react-router-dom";

import appState from "../../oop/state/AppState";
import Item from "../../oop/models/Item";
import { EVENTS } from "../../oop/state/events";

import imgBembosLogo from '../../assets/images/bembos-logo.png';
import imgBembosNuggets from '../../assets/images/nuggets.jpg';
import imgBembosExtrema from '../../assets/images/hamburguesa-extrema.jpg';

import imgNeveraLogo from '../../assets/images/neverafit-logo.jpg';
import imgNeveraAcai from '../../assets/images/bowl-acai.jpg';
import imgNeveraTostadas from '../../assets/images/pan-palta.jpg';

import imgSushiLogo from '../../assets/images/sushi-logo.jpg';
import imgSushiAcevichado from '../../assets/images/makis-acevichado.jpg';
import imgSushiPoke from '../../assets/images/poke-atun.jpg';

class Store {
  constructor(id, name, desc, image) {
    this.id = id; this.name = name; this.desc = desc; this.image = image; this.items = [];
  }
  addItem(item) { this.items.push(item); }
}

const storeBembos = new Store("s1", "Bembos", "Las hamburguesas más bravas", imgBembosLogo);
storeBembos.addItem(new Item("p1", "Nuggets", 18, "¡Prueba nuestros deliciosos Nuggets de pollo!", imgBembosNuggets));
storeBembos.addItem(new Item("p2", "Hamburguesa Extrema", 20.90, "Doble carne, queso Edam, tocino, tomate, lechuga y mayonesa.", imgBembosExtrema));

const storeLaNevera = new Store("s2", "La Nevera Fit", "Tus desayunos siempre ganan", imgNeveraLogo);
storeLaNevera.addItem(new Item("p3", "Açai Bowl", 25, "Con granola, plátano, fresas y arándanos.", imgNeveraAcai));
storeLaNevera.addItem(new Item("p4", "Tostadas con Palta", 15, "Dos tostadas de pan integral con palta y semillas.", imgNeveraTostadas));

const storeMrSushi = new Store("s3", "Mr. Sushi", "Cada maki es un bocado de pura felicidad", imgSushiLogo);
storeMrSushi.addItem(new Item("p5", "Acevichado Maki", 28, "Roll de langostino empanizado y palta, cubierto con láminas de pescado blanco.", imgSushiAcevichado));
storeMrSushi.addItem(new Item("p6", "Poke Atún Fresco", 29.90, "Base de arroz sushi, salsa de ostión, col morada, zanahoria y cubos de Atún.", imgSushiPoke));

const STORES = [storeBembos, storeLaNevera, storeMrSushi];

export default class CustomerHome extends React.Component {
  state = {
    cartCount: 0,
    selectedStoreId: null
  };

  componentDidMount() {
    this.unsub = appState.on(EVENTS.CART_CHANGED, (cartItems) => this.setState({ cartCount: cartItems.length }));
    this.setState({ cartCount: appState.cart.length });
  }

  componentWillUnmount() {
    this.unsub && this.unsub();
  }

  addToCart = (item) => {
  const itemForCart = new Item(
    item.id,
    item.name,
    item.price,
    item.desc,
    item.image, // ← pasar imagen
    1           // qty
  );
  appState.addToCart(itemForCart);
}

  
  handleToggleStore = (storeId) => {
    this.setState(prevState => ({
      selectedStoreId: prevState.selectedStoreId === storeId ? null : storeId
    }));
  }

  render() {
    return (
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Tiendas</h1>
            <p className="text-slate-500">Elige tu tienda y platos favoritos</p>
          </div>
          <Link to="/customer/cart" className="pill">Carrito ({this.state.cartCount})</Link>
        </div>

        <div className="flex flex-col gap-6">
          {STORES.map(store => (
            <div key={store.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img 
                  src={store.image} 
                  alt={store.name} 
                  className="h-24 w-24 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold">{store.name}</h3>
                  <p className="text-slate-500">{store.desc}</p>
                </div>
                <button 
                  className="btn btn-primary self-center flex-shrink-0"
                  onClick={() => this.handleToggleStore(store.id)}
                >
                  {this.state.selectedStoreId === store.id ? "Cerrar" : "Ver Productos"}
                </button>
              </div>

              {this.state.selectedStoreId === store.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold mb-2">Productos de {store.name}</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {store.items.map(it => (
                      <div key={it.id} className="card p-0 overflow-hidden flex flex-col">
                      <img
                        src={it.image}            // ← usa la imagen del item
                        alt={it.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold">{it.name}</h3>
                        <p className="text-sm text-slate-500">{it.desc}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-semibold">S/ {it.price}</span>
                          <button className="btn btn-primary" onClick={() => this.addToCart(it)}>
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }
}