import { EVENTS } from "./events.js";
import AuthService from "../services/AuthService.js";
import OrderService from "../services/OrderService.js";
import StoreService from "../services/StoreService.js";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

class AppState {
  constructor() {
    if (AppState.instance) {
      return AppState.instance;
    }

    this.listeners = new Map();

    this.user = null;
    this.cart = [];
    this.orders = [];
    this.stores = [];
    this.activeStoreId = null;

    this.auth = new AuthService();
    this.orderSrv = new OrderService();
    this.storeSrv = new StoreService();

    this._storesPromise = null;
    this._ordersPromise = null;
    this._bootstrapPromise = null;

    AppState.instance = this;
  }

  bootstrap() {
    if (!this._bootstrapPromise) {
      this._bootstrapPromise = this._doBootstrap();
    }
    return this._bootstrapPromise;
  }

  async _doBootstrap() {
    const restored = this.auth.restoreSession?.();
    if (restored?.user) {
      this.user = restored.user;
      this.emit(EVENTS.AUTH_CHANGED, this.user);
    }

    if (restored?.token) {
      try {
        const profile = await this.auth.fetchProfile();
        this.user = profile;
        this.emit(EVENTS.AUTH_CHANGED, this.user);
        await this.loadOrders(true);
      } catch (_error) {
        this.auth.logout();
        this.user = null;
        this.emit(EVENTS.AUTH_CHANGED, null);
      }
    }

    try {
      await this.loadStores(true);
    } catch (_error) {
      // Se manejará en el componente
    }
  }

  on(event, fn) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(fn);
    return () => {
      const subs = this.listeners.get(event);
      if (subs) {
        subs.delete(fn);
      }
    };
  }

  emit(event, payload) {
    const subs = this.listeners.get(event);
    if (subs) {
      subs.forEach((fn) => {
        try {
          fn(payload);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error en listener", event, error);
        }
      });
    }
  }

  async login(email, pass) {
    const { user } = await this.auth.login(email, pass);
    this.user = user;
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.loadOrders(true).catch(() => {});
    return this.user;
  }

  async register(payload) {
    const { user } = await this.auth.register(payload);
    this.user = user;
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.loadOrders(true).catch(() => {});
    return this.user;
  }

  async setRole(role) {
    if (!this.user || this.user.role === role) {
      return this.user;
    }
    const updated = await this.auth.updateProfile({ rol: role });
    this.user = updated;
    this.emit(EVENTS.AUTH_CHANGED, this.user);
    await this.loadOrders(true).catch(() => {});
    return this.user;
  }

  logout() {
    this.auth.logout();
    this.user = null;
    this.cart = [];
    this.orders = [];
    this.stores = this.stores || [];
    this.activeStoreId = null;
    this.emit(EVENTS.AUTH_CHANGED, null);
    this.emit(EVENTS.CART_CHANGED, this.cart);
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
  }

  addToCart(item, storeId) {
    if (!item || !item.id) {
      throw new Error("Producto inválido");
    }

    const resolvedStoreId = storeId ?? item.storeId ?? this.activeStoreId ?? null;
    if (this.cart.length && this.activeStoreId && resolvedStoreId && this.activeStoreId !== resolvedStoreId) {
      const error = new Error("Solo puedes agregar productos de una tienda por pedido. Vacía el carrito para cambiar de tienda.");
      error.code = "CART_DIFFERENT_STORE";
      throw error;
    }

    this.activeStoreId = resolvedStoreId ?? this.activeStoreId ?? null;

    const cartItem = {
      ...item,
      storeId: resolvedStoreId ?? item.storeId ?? null,
      price: Number(item.price ?? 0),
      qty: Number(item.qty ?? 1) || 1,
      cartId: generateId(),
    };

    this.cart = [...this.cart, cartItem];
    this.emit(EVENTS.CART_CHANGED, this.cart);
    return cartItem;
  }

  removeFromCart(cartId) {
    const before = this.cart.length;
    this.cart = this.cart.filter((item) => item.cartId !== cartId);
    if (!this.cart.length) {
      this.activeStoreId = null;
    }
    if (this.cart.length !== before) {
      this.emit(EVENTS.CART_CHANGED, this.cart);
    }
  }

  clearCart() {
    this.cart = [];
    this.activeStoreId = null;
    this.emit(EVENTS.CART_CHANGED, this.cart);
  }

  async placeOrder(details = {}) {
    if (!this.user) {
      throw new Error("Debes iniciar sesión para crear un pedido");
    }
    if (!this.cart.length) {
      throw new Error("El carrito está vacío");
    }
    const storeId = details.storeId ?? this.activeStoreId;
    if (!storeId) {
      throw new Error("No se pudo determinar la tienda del pedido");
    }

    const order = await this.orderSrv.placeOrder(this.cart, {
      storeId,
      address: details.address,
      notes: details.notes,
      cardId: details.cardId,
    });

    if (order) {
      const existingIndex = this.orders.findIndex((o) => String(o.id) === String(order.id));
      if (existingIndex >= 0) {
        const next = [...this.orders];
        next[existingIndex] = order;
        this.orders = next;
      } else {
        this.orders = [...this.orders, order];
      }
      this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    }

    this.clearCart();
    return order;
  }

  async loadOrders(force = false) {
    if (!this.user) {
      if (this.orders.length) {
        this.orders = [];
        this.emit(EVENTS.ORDERS_CHANGED, this.orders);
      }
      return [];
    }

    if (this._ordersPromise && !force) {
      return this._ordersPromise;
    }

    const promise = this.orderSrv
      .listOrders()
      .then((orders) => {
        this.orders = orders;
        this.emit(EVENTS.ORDERS_CHANGED, this.orders);
        return orders;
      })
      .finally(() => {
        if (this._ordersPromise === promise) {
          this._ordersPromise = null;
        }
      });

    this._ordersPromise = promise;
    return promise;
  }

  async getOrder(orderId, { force = false } = {}) {
    const existing = this.orders.find((o) => String(o.id) === String(orderId));
    if (existing && !force) {
      return existing;
    }
    if (!this.user) {
      return null;
    }
    const order = await this.orderSrv.getOrder(orderId);
    if (!order) {
      return null;
    }
    const index = this.orders.findIndex((o) => String(o.id) === String(order.id));
    if (index >= 0) {
      const next = [...this.orders];
      next[index] = order;
      this.orders = next;
    } else {
      this.orders = [...this.orders, order];
    }
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return order;
  }

  async updateStatus(orderId, status, notes) {
    if (!this.user) {
      throw new Error("Debes iniciar sesión");
    }
    const order = await this.orderSrv.updateStatus(orderId, status, notes);
    if (!order) {
      return null;
    }
    const index = this.orders.findIndex((o) => String(o.id) === String(order.id));
    if (index >= 0) {
      const next = [...this.orders];
      next[index] = order;
      this.orders = next;
    } else {
      this.orders = [...this.orders, order];
    }
    this.emit(EVENTS.ORDERS_CHANGED, this.orders);
    return order;
  }

  async loadStores(force = false) {
    if (this._storesPromise && !force) {
      return this._storesPromise;
    }

    const promise = this.storeSrv
      .listStores()
      .then((stores) => {
        this.stores = stores;
        this.emit(EVENTS.STORES_CHANGED, this.stores);
        return stores;
      })
      .finally(() => {
        if (this._storesPromise === promise) {
          this._storesPromise = null;
        }
      });

    this._storesPromise = promise;
    return promise;
  }
}

const appState = new AppState();
export default appState;
