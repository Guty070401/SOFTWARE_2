import { EVENTS } from "./events.js";
import AuthService from "../services/AuthService.js";
import OrderService from "../services/OrderService.js";
import UserService from "../services/UserService.js";
import ApiClient from "../services/ApiClient.js";
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
    this.userSrv = new UserService();

    this.token = ApiClient.getAuthToken();
    this.restoring = false;

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
    const { user, token } = await this.auth.login(email, pass);
    this.user = user;
    this.token = token;
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.syncOrders();
    return this.user;
  }
  async register(payload){
    const { user, token } = await this.auth.register(payload);
    this.user = user;
    this.token = token;
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.syncOrders();
    return this.user;
  }
  async setRole(role){
    if (!this.user || !role) return;
    try {
      const updated = await this.userSrv.updateProfile({ rol: role });
      this.user = updated;
      this.emit(EVENTS.AUTH_CHANGED, this.user);
      await this.syncOrders();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se pudo actualizar el rol", error);
      throw error;
    }
  }
  logout(){
    this.auth.logout();
    this.user = null;
    this.token = null;
    this.cart = [];
    this.orders = [];
    this.emit(EVENTS.AUTH_CHANGED, null);
    this.emit(EVENTS.CART_CHANGED, this.cart);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
  }

  async restoreSession(){
    if (this.user || this.restoring) return this.user;
    if (!ApiClient.getAuthToken()) return null;
    this.restoring = true;
    try {
      const profile = await this.userSrv.getProfile();
      this.user = profile;
      this.emit(EVENTS.AUTH_CHANGED, this.user);
      await this.syncOrders();
      return this.user;
    } catch (error) {
      this.auth.logout();
      this.user = null;
      this.token = null;
      this.emit(EVENTS.AUTH_CHANGED, null);
      return null;
    } finally {
      this.restoring = false;
    }
  }

  // --- Cart ---
  addToCart(item) {
    const cartItem = { ...item, cartId: Date.now() + Math.random() };
    if (item instanceof Item && !cartItem.storeId){
      cartItem.storeId = item.storeId;
      cartItem.storeName = item.storeName;
    }
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
  async placeOrder(orderDetails = {}){
    const order = await this.orderSrv.placeOrder(this.cart, orderDetails);
    this.orders = [...this.orders, order];
    this.clearCart();
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return order;
  }
  async updateStatus(orderId, status){
    const found = this.orders.find(o => o.id === orderId);
    if (!found) return null;
    const updated = await this.orderSrv.updateStatus(found, status);
    this.orders = this.orders.map((order) => order.id === orderId ? updated : order);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return updated;
  }

  async syncOrders(){
    if (!this.user || !ApiClient.getAuthToken()) {
      this.orders = [];
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
      return [];
    }
    try {
      const orders = await this.orderSrv.listOrders();
      this.orders = orders;
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
      return orders;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se pudieron sincronizar las órdenes", error);
      return this.orders;
    }
  }
}

const appState = new AppState(); // Singleton
export default appState;
