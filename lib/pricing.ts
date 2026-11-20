import { fragrances, fromPrice, getVariant } from './catalog'
import { site } from './site'

export type Line = { variantId: string; qty: number }
export type Plan = 'full' | 'deposit'

export type PricedLine = {
  variantId: string
  slug: string
  name: string
  size: string
  unit: number
  qty: number
  total: number
}

export type Totals = {
  lines: PricedLine[]
  subtotal: number
  shipping: number
  total: number
  plan: Plan
  dueNow: number
  balance: number
  count: number
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const formatINR = (n: number) => inr.format(n)

/** The edition's price in one phrase: "₹2,500" when every bottle costs the same, else "From ₹1,999". */
export function editionPrice() {
  const prices = fragrances.map(fromPrice)
  const amount = Math.min(...prices)
  const same = prices.every((x) => x === amount)
  return { amount, same, label: same ? formatINR(amount) : `From ${formatINR(amount)}` }
}

export function depositAvailable() {
  return site.deposit.enabled
}

/**
 * Single source of truth for money — used by the cart, checkout and the API.
 * Guests are capped at `maxPerVariant`; the concierge's manual orders pass a higher cap.
 */
export function priceLines(lines: Line[], plan: Plan = 'full', maxQty: number = site.edition.maxPerVariant): Totals {
  const priced: PricedLine[] = []
  for (const l of lines) {
    const found = getVariant(l.variantId)
    if (!found) continue
    const qty = Math.max(1, Math.min(maxQty, Math.floor(l.qty)))
    priced.push({
      variantId: found.variant.id,
      slug: found.product.slug,
      name: found.product.name,
      size: found.variant.size,
      unit: found.variant.price,
      qty,
      total: found.variant.price * qty,
    })
  }
  const subtotal = priced.reduce((s, l) => s + l.total, 0)
  const shipping = priced.length ? site.shipping.fee : 0
  const total = subtotal + shipping
  const effectivePlan: Plan = plan === 'deposit' && depositAvailable() ? 'deposit' : 'full'
  const dueNow =
    effectivePlan === 'deposit' ? Math.round((total * site.deposit.percent) / 100) : total
  return {
    lines: priced,
    subtotal,
    shipping,
    total,
    plan: effectivePlan,
    dueNow,
    balance: total - dueNow,
    count: priced.reduce((s, l) => s + l.qty, 0),
  }
}
