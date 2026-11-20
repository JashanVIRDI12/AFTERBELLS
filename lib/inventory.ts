import 'server-only'
import { products } from './catalog'
import { site } from './site'
import { getStore, type InventoryRow } from './db'

/** Defaults come from lib/site.ts; anything the house changes in /admin is stored and wins. */
export function defaultRow(variantId: string): InventoryRow {
  return {
    variantId,
    editionSize: site.edition.stockPerFragrance,
    offline: (site.edition.soldOffline as Record<string, number>)[variantId] ?? 0,
    paused: false,
  }
}

export async function getInventory(): Promise<Record<string, InventoryRow>> {
  const stored = await (await getStore()).getInventory()
  const out: Record<string, InventoryRow> = {}
  for (const p of products) for (const v of p.variants) out[v.id] = stored[v.id] ?? defaultRow(v.id)
  return out
}

export async function updateInventory(
  variantId: string,
  patch: Partial<Pick<InventoryRow, 'editionSize' | 'offline' | 'paused'>>,
  note?: string,
) {
  const current = (await getInventory())[variantId]
  if (!current) throw new Error('Unknown fragrance')
  const next: InventoryRow = { ...current, ...patch, variantId }
  const changes: string[] = []
  if (next.editionSize !== current.editionSize) changes.push(`edition ${current.editionSize} → ${next.editionSize}`)
  if (next.offline !== current.offline) changes.push(`sold offline ${current.offline} → ${next.offline}`)
  if (next.paused !== current.paused) changes.push(next.paused ? 'paused' : 'resumed')
  if (!changes.length) return current
  await (await getStore()).setInventory(next, changes.join(' · '), note)
  return next
}
