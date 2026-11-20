'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { site } from './site'
import type { Line } from './pricing'

type CartState = {
  lines: Line[]
  add: (variantId: string, qty?: number) => void
  setQty: (variantId: string, qty: number) => void
  remove: (variantId: string) => void
  clear: () => void
}

const clamp = (n: number) => Math.max(1, Math.min(site.edition.maxPerVariant, n))

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (variantId, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === variantId)
          if (existing) {
            return {
              lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: clamp(l.qty + qty) } : l)),
            }
          }
          return { lines: [...s.lines, { variantId, qty: clamp(qty) }] }
        }),
      setQty: (variantId, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: clamp(qty) } : l)) })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'ab-bag',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
    },
  ),
)

type UIState = {
  /** true once the intro curtain has lifted (hero animations wait for this) */
  ready: boolean
  hydrated: boolean
  menuOpen: boolean
  cartOpen: boolean
  set: (p: Partial<Omit<UIState, 'set'>>) => void
}

export const useUI = create<UIState>()((set) => ({
  ready: false,
  hydrated: false,
  menuOpen: false,
  cartOpen: false,
  set: (p) => set(p),
}))
