import { EVENTS } from "./events.js";
import AuthService from "../services/AuthService.js";
import OrderService from "../services/OrderService.js";
import OrderStatus from "../models/OrderStatus.js";
import Item from "../models/Item.js";
import { api } from "../../services/api.js";
import { getRealtimeClient } from "../../services/realtimeClient.js";

export class AppState {
  constructor(options = {}){
    const {
      auth = new AuthService(),
      orderSrv = new OrderService(),
      forceNew = false,
    } = options;

    if (AppState.instance && !forceNew) return AppState.instance;
    this.listeners = new Map();
    this.user = null;
    this.cart = /** @type {Item[]} */([]);
    this.orders = [];
    this.auth = auth;
    this.orderSrv = orderSrv;
    this.chatByOrder = new Map();
    this.chatSubscribers = new Map();
    this.chatChannels = new Map();

    AppState.instance = this;
  }

  on(event, fn){
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event).delete(fn);
  }
  emit(event, payload){
    const subs = this.listeners.get(event);
    if (subs) subs.forEach(fn => fn(payload));
  }

  async login(email, pass){
    this.user = await this.auth.login(email, pass);
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    return this.user;
  }
  async register(payload){
    const u = await this.auth.register(payload);
    this.user = null;
    this.emit(EVENTS.AUTH_CHANGED, null);
    return u;
  }
  async verifyEmailToken(token){
    const u = await this.auth.verifyEmailToken(token);
    this.user = u;
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    return u;
  }
  setRole(role){
    if (this.user) { this.user.setRole(role); this.emit(EVENTS.AUTH_CHANGED, this.user); }
  }
  logout(){ this.auth.logout && this.auth.logout(); this.user = null; this.emit(EVENTS.AUTH_CHANGED, null); }

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

  async placeOrder(meta = {}){
    const cartSnapshot = Array.isArray(this.cart) ? [...this.cart] : [];
    const paymentDetails = meta?.paymentDetails || null;
    const extraPayload = {};
    if (paymentDetails?.publicSummary) {
      extraPayload.comentarios = paymentDetails.publicSummary;
    }
    const order = await this.orderSrv.placeOrder(cartSnapshot, { extraPayload });

    try {
      const fromApi = await this.orderSrv.getById(order.id);
      if (fromApi && typeof fromApi === 'object') Object.assign(order, fromApi);
    } catch (e) {
      console.warn('[AppState] No se pudo obtener detalle de orden. Usando datos locales.', e);
    }

    if (paymentDetails) {
      order.paymentDetails = paymentDetails;
      if (paymentDetails.publicSummary) {
        order.paymentSummary = paymentDetails.publicSummary;
        if (!order.comentarios) order.comentarios = paymentDetails.publicSummary;
      }
    }

    const detailedItems = cartSnapshot.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty ?? 1, image: i.image }));

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      order.items = detailedItems;
    } else {
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

    const sum = (Array.isArray(order.items) ? order.items : []).reduce((a, it)=> {
      const p = Number(it.price ?? it.precio ?? it.precioUnitario ?? 0);
      const q = Number(it.qty ?? it.cantidad ?? 1);
      return a + (p * q);
    }, 0);
    if (order.total == null || Number(order.total) === 0) order.total = Number(sum.toFixed(2));

    if (paymentDetails?.method === 'cash' && Number(paymentDetails.amount)) {
      const amount = Number(paymentDetails.amount);
      const change = Math.max(0, amount - order.total);
      const base = paymentDetails.publicSummary || `PAGARÁ CON S/ ${amount.toFixed(2)}`;
      const withChange = change > 0 ? `${base} (vuelto S/ ${change.toFixed(2)})` : base;
      order.paymentSummary = withChange;
      order.paymentDetails.publicSummary = withChange;
      order.comentarios = withChange;
    }

    if (!order.customerName && this.user?.name) order.customerName = this.user.name;
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
    try {
      const fresh = await this.orderSrv.getById(found.id);
      if (fresh && typeof fresh === 'object') Object.assign(found, fresh);
    } catch {}
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

  getChatMessages(orderId){
    return this.chatByOrder.get(String(orderId)) || [];
  }

  notifyChat(orderId){
    const listeners = this.chatSubscribers.get(String(orderId));
    if (listeners) {
      const snapshot = this.getChatMessages(orderId);
      listeners.forEach((fn)=> fn(snapshot));
    }
    this.emit(EVENTS.CHAT_CHANGED, { orderId, messages: this.getChatMessages(orderId) });
  }

  setChat(orderId, messages){
    this.chatByOrder.set(String(orderId), Array.isArray(messages) ? messages : []);
    this.notifyChat(orderId);
  }

  appendChat(orderId, message){
    if (!message) return;
    const current = this.getChatMessages(orderId);
    this.chatByOrder.set(String(orderId), [...current, message]);
    this.notifyChat(orderId);
  }

  subscribeToChat(orderId, listener){
    const key = String(orderId);
    if (!this.chatSubscribers.has(key)) this.chatSubscribers.set(key, new Set());
    const bag = this.chatSubscribers.get(key);
    bag.add(listener);
    listener(this.getChatMessages(orderId));
    return ()=> {
      bag.delete(listener);
      if (bag.size === 0) this.chatSubscribers.delete(key);
    };
  }

  async loadChat(orderId){
    const { messages = [] } = await api.get(`/api/orders/${orderId}/chat`);
    this.setChat(orderId, messages);
    return messages;
  }

  async sendChatMessage(orderId, text){
    const payload = await api.post(`/api/orders/${orderId}/chat`, { message: text });
    if (payload?.message) this.appendChat(orderId, payload.message);
    return payload?.message;
  }

  async ensureChatSession(orderId){
    const key = String(orderId);
    if (!this.chatByOrder.has(key)) {
      try {
        await this.loadChat(orderId);
      } catch (err) {
        console.error("[Chat] No se pudo cargar historial", err);
      }
    }
    this.connectChatChannel(orderId);
  }

  connectChatChannel(orderId){
    const key = String(orderId);
    if (this.chatChannels.has(key)) return;
    const client = getRealtimeClient();
    if (!client) return;
    const channel = client
      .channel(`order-chat-${key}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orden_chat", filter: `orden_id=eq.${orderId}` },
        (payload)=>{
          const row = payload?.new;
          if (row) {
            this.appendChat(orderId, {
              id: row.id,
              ordenId: row.orden_id,
              usuarioId: row.usuario_id,
              rol: row.rol,
              mensaje: row.mensaje,
              createdAt: row.creado_en,
            });
          }
        }
      )
      .subscribe();
    this.chatChannels.set(key, channel);
  }
}

AppState.instance = null;

export const createAppState = (options = {})=> new AppState({ ...options, forceNew: true });

const appState = new AppState();
export default appState;
