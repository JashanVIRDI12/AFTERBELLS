import 'server-only'
import { products } from './catalog'
import { reservedByVariant } from './orders'
import { getInventory } from './inventory'
import type { InventoryRow, Reserved } from './db'

export type StockEntry = {
  edition: number
  /** online + offline */
  reserved: number
  online: number
  offline: number
  /** what guests may still reserve (0 while paused) */
  remaining: number
  paused: boolean
}
export type Stock = Record<string, StockEntry>

/**
 * Edition stock from real orders plus the house's inventory settings.
 * Guests only ever see this in words ("Limited production", "Few remaining"), never as numbers.
 */
export function stockFrom(online: Reserved, inventory: Record<string, InventoryRow>): Stock {
  const out: Stock = {}
  for (const p of products) {
    for (const v of p.variants) {
      const inv = inventory[v.id]
      const edition = inv?.editionSize ?? 0
      const onl = online[v.id] ?? 0
      const off = inv?.offline ?? 0
      const reserved = Math.min(edition, onl + off)
      out[v.id] = {
        edition,
        reserved,
        online: onl,
        offline: off,
        remaining: inv?.paused ? 0 : Math.max(0, edition - reserved),
        paused: Boolean(inv?.paused),
      }
    }
  }
  return out
}

export async function getStock(): Promise<Stock> {
  const [reserved, inventory] = await Promise.all([reservedByVariant(), getInventory()])
  return stockFrom(reserved, inventory)
}

/** The public view: no internal counts beyond what the meter needs. */
export async function getPublicStock() {
  const s = await getStock()
  return Object.fromEntries(
    Object.entries(s).map(([k, v]) => [k, { edition: v.edition, reserved: v.reserved, remaining: v.remaining }]),
  )
}
