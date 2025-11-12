import { EVENTS } from "./events.js";
import AuthService from "../services/AuthService.js";
import OrderService from "../services/OrderService.js";
import OrderStatus from "../models/OrderStatus.js";
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
  logout(){ this.auth.logout && this.auth.logout(); this.user = null; this.emit(EVENTS.AUTH_CHANGED, null); }

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
    const cartSnapshot = Array.isArray(this.cart) ? [...this.cart] : [];
    const order = await this.orderSrv.placeOrder(cartSnapshot);

    // Intentar obtener detalle real desde backend
    try {
      const fromApi = await this.orderSrv.getById(order.id);
      if (fromApi && typeof fromApi === 'object') Object.assign(order, fromApi);
    } catch (e) {
      console.warn('[AppState] No se pudo obtener detalle de orden. Usando datos locales.', e);
    }

    // Enriquecer con snapshot del carrito si faltan datos
    const detailedItems = cartSnapshot.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty ?? 1, image: i.image }));

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      order.items = detailedItems;
    } else {
      // Completar datos faltantes usando el snapshot del carrito
      const mapById = new Map();
      cartSnapshot.forEach(i => { mapById.set(String(i.id), i); });
      order.items = order.items.map(it => {
        const pid = String(it.productoId ?? it.id ?? "");
        const snap = mapById.get(pid);
        return {
          ...it,
          name: it.name ?? snap?.name,
          price: it.price ?? it.precio ?? snap?.price,
          qty: it.qty ?? it.cantidad ?? snap?.qty ?? 1,
        };
      });
    }

    // Total y estado por defecto
    const sum = (Array.isArray(order.items) ? order.items : []).reduce((a, it)=> {
      const p = Number(it.price ?? it.precio ?? 0);
      const q = Number(it.qty ?? it.cantidad ?? 1);
      return a + (p * q);
    }, 0);
    if (order.total == null || Number(order.total) === 0) order.total = Number(sum.toFixed(2));
    if (!order.customerName && this.user?.name) order.customerName = this.user.name;
    // Normalizar estado a nuestros valores conocidos
    const normalize = (s)=> {
      if (!s) return null;
      const v = String(s).toLowerCase().replace(/\s+/g,'_');
      const map = new Map([
        ['pending', OrderStatus.PENDING], ['pendiente', OrderStatus.PENDING],
        ['accepted', OrderStatus.ACCEPTED], ['aceptado', OrderStatus.ACCEPTED],
        ['picked', OrderStatus.PICKED], ['recogido', OrderStatus.PICKED],
        ['on_route', OrderStatus.ON_ROUTE], ['en_camino', OrderStatus.ON_ROUTE],
        ['delivered', OrderStatus.DELIVERED], ['entregado', OrderStatus.DELIVERED],
        ['canceled', OrderStatus.CANCELED], ['cancelled', OrderStatus.CANCELED], ['cancelado', OrderStatus.CANCELED]
      ]);
      return map.get(v) || OrderStatus.PENDING;
    };
    order.status = normalize(order.status) || OrderStatus.PENDING;

    this.orders = [...this.orders, order];
    this.clearCart();
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return order;
  }
  async updateStatus(orderId, status){
    const found = this.orders.find(o => o.id === orderId);
    if (!found) return null;
    await this.orderSrv.updateStatus(found, status);
    // Refrescar desde backend si es posible
    try {
      const fresh = await this.orderSrv.getById(found.id);
      if (fresh && typeof fresh === 'object') Object.assign(found, fresh);
    } catch {}
    // Normalizar estado para el front
    const normalize = (s)=> {
      if (!s) return null;
      const v = String(s).toLowerCase().replace(/\s+/g,'_');
      const map = new Map([
        ['created', OrderStatus.PENDING],
        ['pending', OrderStatus.PENDING], ['pendiente', OrderStatus.PENDING],
        ['accepted', OrderStatus.ACCEPTED], ['aceptado', OrderStatus.ACCEPTED],
        ['picked', OrderStatus.PICKED], ['recogido', OrderStatus.PICKED],
        ['on_route', OrderStatus.ON_ROUTE], ['en_camino', OrderStatus.ON_ROUTE],
        ['delivered', OrderStatus.DELIVERED], ['entregado', OrderStatus.DELIVERED],
        ['canceled', OrderStatus.CANCELED], ['cancelled', OrderStatus.CANCELED], ['cancelado', OrderStatus.CANCELED]
      ]);
      return map.get(v) || OrderStatus.PENDING;
    };
    found.status = normalize(found.status);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return found;
  }

  async fetchOrders(){
    const list = await this.orderSrv.list();
    const normalize = (s)=> {
      if (!s) return null;
      const v = String(s).toLowerCase().replace(/\s+/g,'_');
      const map = new Map([
        ['created', OrderStatus.PENDING],
        ['pending', OrderStatus.PENDING], ['pendiente', OrderStatus.PENDING],
        ['accepted', OrderStatus.ACCEPTED], ['aceptado', OrderStatus.ACCEPTED],
        ['picked', OrderStatus.PICKED], ['recogido', OrderStatus.PICKED],
        ['on_route', OrderStatus.ON_ROUTE], ['en_camino', OrderStatus.ON_ROUTE],
        ['delivered', OrderStatus.DELIVERED], ['entregado', OrderStatus.DELIVERED],
        ['canceled', OrderStatus.CANCELED], ['cancelled', OrderStatus.CANCELED], ['cancelado', OrderStatus.CANCELED]
      ]);
      return map.get(v) || OrderStatus.PENDING;
    };
    const normalized = (Array.isArray(list) ? list : []).map(o => {
      const order = { ...o };
      order.status = normalize(order.status || order.estado);
      if (!Array.isArray(order.items)) order.items = [];
      if (order.total == null) {
        const sum = order.items.reduce((a, it)=> a + Number(it.price ?? it.precio ?? 0) * Number(it.qty ?? it.cantidad ?? 1), 0);
        order.total = Number(sum.toFixed(2));
      }
      return order;
    });
    this.orders = normalized;
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return this.orders;
  }
}

const appState = new AppState(); // Singleton
export default appState;
