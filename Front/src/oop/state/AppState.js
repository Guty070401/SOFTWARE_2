import { EVENTS } from "./events.js";
import AuthService from "../services/AuthService.js";
import OrderService from "../services/OrderService.js";
import Item from "../models/Item.js";

class AppState {
  constructor(){
    if (AppState.instance) return AppState.instance;
    this.listeners = new Map(); // { event: Set<fn> }
    // Estado
    this.user = null;
    this.cart = /** @type {Item[]} */([]);
    this.orders = [];
    // Servicios
    this.auth = new AuthService();
    this.orderSrv = new OrderService();

    AppState.instance = this;
  }

  // --- Pub/Sub simple ---
  on(event, fn){
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event).delete(fn);
  }
  emit(event, payload){
    const subs = this.listeners.get(event);
    if (subs) subs.forEach(fn => fn(payload));
  }

  // --- Auth ---
  async login(email, pass){
    this.user = await this.auth.login(email, pass);
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    return this.user;
  }
  async register(payload){
    this.user = await this.auth.register(payload);
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    return this.user;
  }
  setRole(role){
    if (this.user) { this.user.setRole(role); this.emit(EVENTS.AUTH_CHANGED, this.user); }
  }
  logout(){ this.user = null; this.emit(EVENTS.AUTH_CHANGED, null); }

  // --- Cart ---
  addToCart(item) {
    const cartItem = { ...item, cartId: Date.now() + Math.random() };
    this.cart.push(cartItem);
    this.emit(EVENTS.CART_CHANGED, this.cart);
  }
  removeFromCart(cartId) {
    this.cart = this.cart.filter(i => i.cartId !== cartId);
    this.emit(EVENTS.CART_CHANGED, this.cart);
  }
  clearCart(){ 
    this.cart = []; 
    this.emit(EVENTS.CART_CHANGED, this.cart); 
  }

  // --- Orders ---
  async placeOrder(){
    const order = await this.orderSrv.placeOrder(this.cart);
    this.orders = [...this.orders, order];
    this.clearCart();
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return order;
  }
  async updateStatus(orderId, status){
    const found = this.orders.find(o => o.id === orderId);
    if (!found) return null;
    await this.orderSrv.updateStatus(found, status);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return found;
  }
}

const appState = new AppState(); // Singleton
export default appState;
