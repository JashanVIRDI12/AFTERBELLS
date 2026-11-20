'use client'

import { useEffect } from 'react'
import { create } from 'zustand'

export type StockEntry = { edition: number; reserved: number; remaining: number }

type S = {
  stock: Record<string, StockEntry> | null
  loading: boolean
  load: () => Promise<void>
}

const useStockStore = create<S>()((set, get) => ({
  stock: null,
  loading: false,
  load: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await fetch('/api/stock', { cache: 'no-store' })
      if (res.ok) set({ stock: await res.json() })
    } catch {
      /* stays null — UI falls back to the static edition size */
    } finally {
      set({ loading: false })
    }
  },
}))

let started = false

/** Live remaining-bottle counts, shared across the page and refreshed on focus. */
export function useStock(variantId?: string) {
  const stock = useStockStore((s) => s.stock)
  useEffect(() => {
    if (!started) {
      started = true
      void useStockStore.getState().load()
      window.addEventListener('focus', () => void useStockStore.getState().load())
    }
  }, [])
  return variantId ? (stock?.[variantId] ?? null) : null
}

export const refreshStock = () => useStockStore.getState().load()
