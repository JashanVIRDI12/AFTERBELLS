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

/** The personalised video with a 60 ml bottle: on unless the guest turns it off (this browser only). */
type VideoState = { on: boolean; setOn: (on: boolean) => void }
export const useVideo = create<VideoState>()(
  persist((set) => ({ on: true, setOn: (on) => set({ on }) }), {
    name: 'ab-video',
    storage: createJSONStorage(() => localStorage),
    skipHydration: true,
    version: 1,
  }),
)

/** Set by "Make it a gift" on a product page; checkout then opens its gift message box. */
export const GIFT_KEY = 'ab-gift'

/** The guest's delivery PIN code, remembered from the product page to checkout (this browser only). */
type PinState = {
  pin: string
  /** City from the postal directory, when it answered */
  place: string
  setPin: (pin: string, place?: string) => void
}

export const usePin = create<PinState>()(
  persist(
    (set) => ({
      pin: '',
      place: '',
      setPin: (pin, place = '') => set({ pin, place }),
    }),
    {
      name: 'ab-pin',
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
