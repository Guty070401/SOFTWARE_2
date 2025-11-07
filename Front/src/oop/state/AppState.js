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

    this.user = this.auth.getStoredUser();
    if (this.user) {
      this.refreshOrders().catch((error) => {
        console.warn('No se pudieron cargar los pedidos iniciales:', error);
      });
    }

    AppState.instance = this;
  }

  sortOrders(orders = []){
    return orders
      .filter(Boolean)
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt || a?.fecha || 0).getTime() || 0;
        const dateB = new Date(b?.createdAt || b?.fecha || 0).getTime() || 0;
        return dateA - dateB;
      });
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
    await this.refreshOrders().catch(() => {});
    return this.user;
  }
  async register(payload){
    this.user = await this.auth.register(payload);
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.refreshOrders().catch(() => {});
    return this.user;
  }
  async setRole(role){
    if (!this.user) return null;
    this.user = await this.auth.updateRole(role);
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.refreshOrders(true).catch(() => {});
    return this.user;
  }
  logout(){
    this.auth.logout();
    this.user = null;
    this.cart = [];
    this.orders = [];
    this.emit(EVENTS.AUTH_CHANGED, null);
    this.emit(EVENTS.CART_CHANGED, this.cart);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
  }

  // --- Cart ---
  addToCart(item) {
    const cartItem = { ...item, cartId: Date.now() + Math.random() };
    cartItem.price = Number(cartItem.price || 0);
    const existingStore = this.cart.find((i) => i.storeId)?.storeId;
    if (existingStore && cartItem.storeId && existingStore !== cartItem.storeId) {
      const error = new Error('Solo puedes agregar productos de una tienda por pedido. Vacía el carrito o finaliza la compra actual antes de cambiar de tienda.');
      error.code = 'CART_STORE_MISMATCH';
      throw error;
    }
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
  async refreshOrders(force = false){
    if (!this.user) {
      this.orders = [];
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
      return [];
    }
    if (!force && typeof navigator !== 'undefined' && !navigator.onLine && this.orders.length) {
      return this.orders;
    }
    const orders = await this.orderSrv.listOrders();
    this.orders = this.sortOrders(Array.isArray(orders) ? orders : []);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return orders;
  }

  async ensureOrdersLoaded(force = false){
    if (!this.user) return [];
    if (!force && this.orders.length) return this.orders;
    try {
      return await this.refreshOrders(force);
    } catch (error) {
      console.error('No se pudieron obtener los pedidos:', error);
      throw error;
    }
  }

  async placeOrder(details = {}){
    if (!this.user) {
      throw new Error('Debes iniciar sesión para crear un pedido.');
    }
    if (!this.cart.length) {
      throw new Error('El carrito está vacío.');
    }
    const storeIds = new Set(
      this.cart
        .map((item) => item.storeId)
        .filter((id) => id !== null && id !== undefined)
        .map((id) => String(id))
    );
    const resolvedStoreId = details.storeId || [...storeIds][0] || null;
    if (!resolvedStoreId) {
      throw new Error('No se pudo determinar la tienda del pedido.');
    }
    if (storeIds.size > 1 && !details.storeId) {
      throw new Error('El pedido solo puede incluir productos de una tienda.');
    }
    const order = await this.orderSrv.placeOrder(this.cart, {
      storeId: resolvedStoreId,
      address: details.address,
      cardId: details.cardId,
      notes: details.notes
    });
    if (order) {
      const filtered = this.orders.filter((o) => String(o.id) !== String(order.id));
      this.orders = this.sortOrders([...filtered, order]);
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
      this.clearCart();
    }
    return order;
  }
  async updateStatus(orderId, status){
    const updated = await this.orderSrv.updateStatus(orderId, status);
    if (!updated) return null;
    const idx = this.orders.findIndex((o) => String(o.id) === String(updated.id));
    const next = idx === -1
      ? [...this.orders, updated]
      : this.orders.map((o, index) => (index === idx ? updated : o));
    this.orders = this.sortOrders(next);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return updated;
  }

  async getOrder(orderId){
    const existing = this.orders.find((o) => String(o.id) === String(orderId));
    if (existing) return existing;
    const order = await this.orderSrv.getOrder(orderId);
    if (order) {
      this.orders = this.sortOrders([order, ...this.orders]);
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    }
    return order;
  }
}

const appState = new AppState(); // Singleton
export default appState;
