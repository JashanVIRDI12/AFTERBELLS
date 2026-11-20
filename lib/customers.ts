import 'server-only'
import type { Order } from './db'

export type Customer = {
  email: string
  name: string
  phone: string
  city: string
  state: string
  orders: number
  bottles: number
  spent: number
  first: string
  last: string
  favourite: string
  salon: boolean
}

/** Everyone who has reserved, one row per email — built from the orders themselves. */
export function customersFrom(orders: Order[], salon: Set<string>): Customer[] {
  const map = new Map<string, Customer & { fav: Record<string, number> }>()
  for (const o of orders) {
    if (o.status !== 'paid' && o.status !== 'dispatched' && o.status !== 'delivered') continue
    const key = o.customer.email.toLowerCase()
    const c =
      map.get(key) ??
      ({
        email: key,
        name: o.customer.name,
        phone: o.customer.phone,
        city: o.customer.city,
        state: o.customer.state,
        orders: 0,
        bottles: 0,
        spent: 0,
        first: o.createdAt,
        last: o.createdAt,
        favourite: '',
        salon: salon.has(key),
        fav: {},
      } as Customer & { fav: Record<string, number> })
    c.orders++
    c.bottles += o.totals.count
    c.spent += o.totals.dueNow
    if (o.createdAt < c.first) c.first = o.createdAt
    if (o.createdAt > c.last) {
      c.last = o.createdAt
      c.name = o.customer.name
      c.phone = o.customer.phone
      c.city = o.customer.city
      c.state = o.customer.state
    }
    for (const l of o.totals.lines) c.fav[l.name] = (c.fav[l.name] ?? 0) + l.qty
    map.set(key, c)
  }
  return [...map.values()]
    .map(({ fav, ...c }) => ({ ...c, favourite: Object.entries(fav).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' }))
    .sort((a, b) => b.spent - a.spent)
}

/** Checkouts started but never paid (older than the 30-minute hold), newest first — people to follow up. */
export function leadsFrom(orders: Order[]) {
  const paidEmails = new Set(
    orders.filter((o) => o.status === 'paid' || o.status === 'dispatched' || o.status === 'delivered').map((o) => o.customer.email.toLowerCase()),
  )
  return orders
    .filter((o) => (o.status === 'pending' || o.status === 'failed') && Date.now() - new Date(o.createdAt).getTime() > 30 * 60_000)
    .filter((o) => !paidEmails.has(o.customer.email.toLowerCase()))
    .reverse()
}
