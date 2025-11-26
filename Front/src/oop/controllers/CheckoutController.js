import appState from "../state/AppState";
import { EVENTS } from "../state/events";

class CheckoutController {
  static instance;

  static getInstance(dependencies = {}) {
    if (!CheckoutController.instance) {
      CheckoutController.instance = new CheckoutController(dependencies);
    }
    return CheckoutController.instance;
  }

  constructor({ app } = {}) {
    if (CheckoutController.instance) return CheckoutController.instance;
    this.appState = app || appState;
    this.state = { total: 0, paying: false, error: "" };
    this.subscribers = new Set();
    this.detachCartListener = null;
    this.bindAppStateEvents();
    CheckoutController.instance = this;
  }

  bindAppStateEvents() {
    if (typeof this.appState.on === "function" && !this.detachCartListener) {
      this.detachCartListener = this.appState.on(EVENTS.CART_CHANGED, () => {
        this.setState({ total: this.computeCartTotal() });
      });
    }
  }

  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    this.subscribers.add(listener);
    listener(this.getState());
    return () => this.subscribers.delete(listener);
  }

  notify() {
    const snapshot = this.getState();
    this.subscribers.forEach((listener) => listener(snapshot));
  }

  getState() {
    return { ...this.state };
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  computeCartTotal() {
    return (this.appState.cart || []).reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Number(item.qty ?? 1);
      return sum + price * qty;
    }, 0);
  }

  ensureAuth(navigate) {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!token && typeof navigate === "function") {
      navigate("/login", { replace: true });
    }
  }

  initialize({ location, navigate } = {}) {
    this.bindAppStateEvents();
    const passed = location?.state?.total ?? 0;
    const fallback = this.computeCartTotal();
    const total = Number(passed || fallback || 0);
    this.setState({ total });
    this.ensureAuth(navigate);
  }

  async pay({ event, navigate, paymentDetails } = {}) {
    const token =
      typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      if (event?.preventDefault) event.preventDefault();
      this.setState({
        error: "Debes iniciar sesión para completar el pago.",
        paying: false,
      });
      if (typeof navigate === "function") {
        navigate("/login", { replace: false });
      }
      return;
    }

    if (event?.preventDefault) event.preventDefault();
    this.setState({ paying: true, error: "" });

    try {
      const cart = this.appState.cart || [];
      if (!cart.length) throw new Error("Tu carrito está vacío");
      if (!paymentDetails) throw new Error("Debes guardar el método de pago");

      const order = await this.appState.placeOrder({ paymentDetails });
      if (typeof navigate === "function") {
        navigate(`/customer/order/${order.id}`, { replace: true });
      }
    } catch (err) {
      console.error("[CheckoutController] pay error:", err);
      this.setState({ error: err?.message || "No se pudo crear la orden" });
    } finally {
      this.setState({ paying: false });
    }
  }
}

export default CheckoutController;
