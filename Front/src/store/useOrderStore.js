// useOrderStore.js — versión corregida
import { create } from "zustand";

export const useOrderStore = create((set) => ({
  cart: [],
  orders: [],

  addToCart: (item) => set((s) => {
    const existing = s.cart.find(i => i.id === item.id);
    if (existing) {
      // Si ya existe el producto, solo aumentamos cantidad
      return {
        cart: s.cart.map(i =>
          i.id === item.id ? { ...i, qty: (i.qty ?? 1) + 1 } : i
        ),
      };
    }
    // Si no existe, lo añadimos con qty=1
    return { cart: [...s.cart, { ...item, qty: 1 }] };
  }),

  // Corrección: solo resta 1 cantidad, no elimina todo el producto
  removeFromCart: (id) => set((s) => ({
    cart: s.cart.flatMap(i => {
      if (i.id !== id) return [i];
      const newQty = (i.qty ?? 1) - 1;
      return newQty > 0 ? [{ ...i, qty: newQty }] : [];
    }),
  })),

  clearCart: () => set({ cart: [] }),

  placeOrder: (total = 0) => set((s) => {
    const id = Date.now().toString();
    const order = { id, items: s.cart, status: "pending", total };
    return { orders: [...s.orders, order], cart: [] };
  }),

  updateStatus: (id, status) => set((s) => ({
    orders: s.orders.map(o => o.id === id ? { ...o, status } : o),
  })),
}));
