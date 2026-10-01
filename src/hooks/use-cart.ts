"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string;
  isMadeToOrder?: boolean;
  maxStock?: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isShaking: boolean;
  lastAddedTimestamp: number | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotalPaise: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isShaking: false,
      lastAddedTimestamp: null,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (item, quantity = 1) => {
        // Trigger visual shake and slash flash
        const now = Date.now();
        setTimeout(() => {
          set({ isShaking: false });
        }, 550);

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          if (existingIndex > -1) {
            const updated = [...state.items];
            const currentItem = updated[existingIndex];
            const max = currentItem.maxStock ?? 99;
            const newQty = Math.min(currentItem.quantity + quantity, max);
            updated[existingIndex] = { ...currentItem, quantity: newQty };
            return {
              items: updated,
              isOpen: true,
              isShaking: true,
              lastAddedTimestamp: now,
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
            isOpen: true,
            isShaking: true,
            lastAddedTimestamp: now,
          };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) => {
              if (item.id === id) {
                const max = item.maxStock ?? 99;
                return { ...item, quantity: Math.min(quantity, max) };
              }
              return item;
            }),
          };
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      subtotalPaise: () => {
        return get().items.reduce(
          (total, item) => total + item.pricePaise * item.quantity,
          0
        );
      },
    }),
    {
      name: "clawcraft_cart_v1",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
