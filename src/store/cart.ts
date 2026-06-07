"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
  sku: string;
  stock: number;
};

export type CartItem = CartProduct & { quantity: number };

type CartState = {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            const maxStock = product.stock > 0 ? product.stock : existing.quantity + quantity;
            const nextQty = Math.min(existing.quantity + quantity, maxStock);
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: nextQty } : i,
              ),
            };
          }
          const initialQty = product.stock > 0 ? Math.min(quantity, product.stock) : quantity;
          return { items: [...state.items, { ...product, quantity: initialQty }] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === id
                ? { ...i, quantity: Math.max(1, i.stock > 0 ? Math.min(quantity, i.stock) : quantity) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "lambari-cart" },
  ),
);

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
