"use client";

import { create } from "zustand";

export type AuthCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  type?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
};

type AuthState = {
  customer: AuthCustomer | null;
  loaded: boolean;
  refresh: () => Promise<void>;
  setCustomer: (c: AuthCustomer | null) => void;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  customer: null,
  loaded: false,

  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ customer: data?.customer ?? null, loaded: true });
    } catch {
      set({ customer: null, loaded: true });
    }
  },

  setCustomer: (c) => set({ customer: c, loaded: true }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignora
    }
    set({ customer: null });
  },
}));
