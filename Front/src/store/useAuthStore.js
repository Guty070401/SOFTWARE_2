import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null, // { id, name, role: 'customer'|'courier' }
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  setRole: (role) => set((s) => (s.user ? { user: { ...s.user, role } } : s)),
}));
