import { create } from "zustand";

export const useOrderStore = create((set) => ({
  cart: [],
  orders: [], // {id, items, status, total}
  addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
  removeFromCart: (id) => set((s) => ({ cart: s.cart.filter(i => i.id !== id) })),
  clearCart: () => set({ cart: [] }),
  placeOrder: (total = 0) => set((s) => {
    const id = Date.now().toString();
    const order = { id, items: s.cart, status: "pending", total };
    return { orders: [...s.orders, order], cart: [] };
  }),
  updateStatus: (id, status) => set((s) => ({
    orders: s.orders.map(o => o.id === id ? { ...o, status } : o)
  })),
}));
