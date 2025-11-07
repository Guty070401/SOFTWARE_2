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
    this.ordersLoaded = false;
    // Servicios
    this.auth = new AuthService();
    this.orderSrv = new OrderService();
    this._restorePromise = null;

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
    if (!this.user) {
      throw new Error("Credenciales inválidas.");
    }
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.refreshOrders({ force: true });
    return this.user;
  }
  async register(payload){
    this.user = await this.auth.register(payload);
    if (!this.user) {
      throw new Error("No se pudo completar el registro.");
    }
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.refreshOrders({ force: true });
    return this.user;
  }
  async setRole(role){
    if (!this.user) return null;
    const updated = await this.auth.updateProfile({ rol: role, role });
    if (updated) {
      this.user = updated;
      this.emit(EVENTS.AUTH_CHANGED, this.user);
    }
    return this.user;
  }
  logout(){
    this.auth.logout();
    this.user = null;
    this.orders = [];
    this.ordersLoaded = false;
    this.clearCart();
    this.emit(EVENTS.AUTH_CHANGED, null);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
  }

  async restore(){
    if (this._restorePromise) return this._restorePromise;
    if (!this.auth.token) return null;

    this._restorePromise = (async () => {
      try {
        const profile = await this.auth.getProfile();
        if (!profile) {
          this.logout();
          return null;
        }
        this.user = profile;
        this.emit(EVENTS.AUTH_CHANGED, this.user);
        await this.refreshOrders({ force: true });
        return this.user;
      } catch (error) {
        this.logout();
        return null;
      } finally {
        this._restorePromise = null;
      }
    })();

    return this._restorePromise;
  }

  // --- Cart ---
  addToCart(item) {
    if (!item) return null;

    if (this.cart.length) {
      const currentStoreId = this.cart[0]?.storeId ?? null;
      if (currentStoreId && item.storeId && currentStoreId !== item.storeId) {
        const error = new Error("Solo puedes agregar productos de una misma tienda por pedido.");
        error.code = "STORE_MISMATCH";
        throw error;
      }
    }

    const cartItem = { ...item, cartId: Date.now() + Math.random() };
    this.cart.push(cartItem);
    this.emit(EVENTS.CART_CHANGED, this.cart);
    return cartItem;
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
  async refreshOrders({ force = false } = {}){
    if (!this.user || !this.auth.token) {
      this.orders = [];
      this.ordersLoaded = false;
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
      return this.orders;
    }

    if (this.ordersLoaded && !force) {
      return this.orders;
    }

    const orders = await this.orderSrv.listOrders();
    this.orders = orders;
    this.ordersLoaded = true;
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return this.orders;
  }

  async fetchOrder(orderId){
    if (!orderId) return null;
    const order = await this.orderSrv.getOrder(orderId);
    if (order) {
      const idx = this.orders.findIndex((o) => String(o.id) === String(order.id));
      if (idx === -1) {
        this.orders = [...this.orders, order];
      } else {
        this.orders = this.orders.map((o, i) => (i === idx ? order : o));
      }
      this.ordersLoaded = true;
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    }
    return order;
  }

  async placeOrder({ address = "", notes = "", cardId = null } = {}){
    if (!this.user) {
      throw new Error("Debes iniciar sesión para crear un pedido.");
    }
    if (!this.cart.length) {
      throw new Error("Tu carrito está vacío.");
    }

    const first = this.cart[0];
    const storeId = first?.storeId ?? null;
    if (!storeId) {
      throw new Error("No se ha podido determinar la tienda del pedido.");
    }

    const itemsByProduct = new Map();
    for (const item of this.cart) {
      if (item.storeId && item.storeId !== storeId) {
        throw new Error("Todos los productos deben pertenecer a la misma tienda.");
      }
      const current = itemsByProduct.get(item.id) || { productoId: item.id, cantidad: 0 };
      current.cantidad += item.qty ?? 1;
      itemsByProduct.set(item.id, current);
    }

    const order = await this.orderSrv.placeOrder({
      storeId,
      items: Array.from(itemsByProduct.values()),
      address,
      notes,
      cardId
    });

    if (order) {
      const idx = this.orders.findIndex((o) => String(o.id) === String(order.id));
      if (idx === -1) {
        this.orders = [...this.orders, order];
      } else {
        this.orders = this.orders.map((o, i) => (i === idx ? order : o));
      }
      this.ordersLoaded = true;
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    }

    this.clearCart();
    return order;
  }

  async updateStatus(orderId, status, notes = ""){
    const updated = await this.orderSrv.updateStatus(orderId, status, notes);
    if (!updated) return null;
    this.orders = this.orders.map((o) => (String(o.id) === String(updated.id) ? updated : o));
    this.ordersLoaded = true;
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return updated;
  }
}

const appState = new AppState(); // Singleton
export default appState;
