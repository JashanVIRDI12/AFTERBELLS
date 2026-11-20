import type { Plan, Totals } from '../pricing'

/**
 * pending    → created, waiting for payment (holds stock for HOLD_MS)
 * paid       → reserved; waiting to be dispatched
 * dispatched → on its way (courier + tracking)
 * delivered  → in the guest's hands
 * failed     → payment failed or never completed
 * cancelled  → cancelled by the house (refund, if any, recorded in `refund`)
 */
export type OrderStatus = 'pending' | 'paid' | 'dispatched' | 'delivered' | 'failed' | 'cancelled'

/** Statuses that hold a bottle from the edition. */
export const RESERVING: OrderStatus[] = ['paid', 'dispatched', 'delivered']

/** Pending orders hold stock for this long while the guest pays. */
export const HOLD_MS = 30 * 60 * 1000

export type Customer = {
  email: string
  phone: string
  name: string
  address1: string
  address2?: string
  city: string
  state: string
  pin: string
}

export type OrderEvent = { at: string; type: string; note?: string }

export type Order = {
  /** unguessable — used in the confirmation URL */
  id: string
  /** human-friendly, e.g. AB-1001 */
  number: string
  createdAt: string
  updatedAt: string
  status: OrderStatus
  plan: Plan
  totals: Totals
  customer: Customer
  gift?: { message: string }
  /** the guest agreed to order updates on WhatsApp */
  whatsappUpdates?: boolean
  /** where the visit that ended in this order came from (campaign tags or referring site) */
  origin?: { source?: string; medium?: string; campaign?: string }
  payment: {
    /** 'manual' = taken by the house outside the site (concierge call, cash, bank transfer) */
    provider: 'razorpay' | 'demo' | 'manual'
    /** how a manual payment was received, e.g. 'UPI', 'Cash', 'Bank transfer' */
    method?: string
    razorpayOrderId?: string
    razorpayPaymentId?: string
    paidAt?: string
  }
  fulfilment?: {
    courier?: string
    tracking?: string
    trackingUrl?: string
    dispatchedAt?: string
    deliveredAt?: string
  }
  refund?: { id?: string; amount: number; status: string; at: string }
  cancelledAt?: string
  /** private note for the house — never shown to the guest */
  note?: string
  events?: OrderEvent[]
  emailedAt?: string
}

export type NewOrder = Omit<Order, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'status' | 'events'>

/** Bottles held per variant id. */
export type Reserved = Record<string, number>

export type Subscriber = { email: string; at: string; source?: string }

/** A client's own details, kept so checkout and the account can be filled in for them. */
export type Profile = {
  email: string
  name: string
  phone: string
  address1: string
  address2?: string
  city: string
  state: string
  pin: string
  createdAt: string
  updatedAt: string
}
export type ProfileInput = Omit<Profile, 'createdAt' | 'updatedAt'>

/** Result of checking a sign-in code. */
export type CodeCheck = 'ok' | 'wrong' | 'expired' | 'none'
/** A sign-in code may be tried this many times before it is spent. */
export const CODE_ATTEMPTS = 5

export type Feedback = {
  id?: string
  fragrance: string[]
  scent: number
  longevity: number
  packaging: number
  comments: string
  name: string
  orderNumber: string
  consent: boolean
  at: string
}

/** Per-fragrance stock settings the house controls from /admin. */
export type InventoryRow = {
  variantId: string
  /** bottles in the edition */
  editionSize: number
  /** bottles sold outside the website (events, DMs) */
  offline: number
  /** stop taking reservations for this fragrance */
  paused: boolean
  updatedAt?: string
}
export type InventoryLog = { at: string; variantId: string; change: string; note?: string }

/** One anonymous visit event. No names, emails or IP addresses. */
export type TrackEvent = {
  at?: string
  name: string
  vid: string
  sid: string
  path: string
  slug?: string
  source?: string
  medium?: string
  campaign?: string
  device?: string
  country?: string
  city?: string
}

export type EventStats = {
  since: string
  visitors: number
  sessions: number
  pageViews: number
  byDay: { day: string; visitors: number; views: number }[]
  topPages: { key: string; n: number }[]
  sources: { key: string; n: number }[]
  devices: { key: string; n: number }[]
  places: { key: string; n: number }[]
  /** count of each event name */
  events: Record<string, number>
  /** unique visitors who fired each event name (for the funnel) */
  reach: Record<string, number>
  products: { slug: string; views: number; adds: number }[]
}

export type CreateResult<F> = { ok: true; order: Order } | { ok: false; fail: F }

export interface Store {
  kind: 'postgres' | 'file'
  /** Creates an order atomically: `check` sees stock held at that instant and may refuse. */
  createOrder<F>(input: NewOrder, check?: (reserved: Reserved) => F | null): Promise<CreateResult<F>>
  getOrder(id: string): Promise<Order | undefined>
  findByNumber(number: string): Promise<Order | undefined>
  findByRazorpayOrder(razorpayOrderId: string): Promise<Order | undefined>
  listOrders(): Promise<Order[]>
  /** every order placed with this email, newest first */
  listOrdersByEmail(email: string): Promise<Order[]>
  /** Read-modify-write under a lock. Return `null` from `mutate` to leave the order untouched. */
  updateOrder(id: string, mutate: (o: Order) => Order | null): Promise<Order | undefined>
  reservedByVariant(): Promise<Reserved>
  /** true when the address is new */
  addSubscriber(email: string, source?: string): Promise<boolean>
  listSubscribers(): Promise<Subscriber[]>
  removeSubscriber(email: string): Promise<boolean>
  addFeedback(f: Omit<Feedback, 'at' | 'id'>): Promise<void>
  listFeedback(): Promise<Feedback[]>
  removeFeedback(id: string): Promise<boolean>
  /** stored inventory rows (variants without a row use the defaults in lib/site.ts) */
  getInventory(): Promise<Record<string, InventoryRow>>
  setInventory(row: InventoryRow, change: string, note?: string): Promise<void>
  listInventoryLog(limit?: number): Promise<InventoryLog[]>
  addEvent(e: TrackEvent): Promise<void>
  eventStats(since: Date): Promise<EventStats>
  health(): Promise<void>
  getProfile(email: string): Promise<Profile | undefined>
  saveProfile(p: ProfileInput): Promise<Profile>
  /** Stores the hash of a new sign-in code for this email, replacing any earlier one. */
  putLoginCode(email: string, hash: string, expiresAt: Date): Promise<void>
  /** Checks a code hash, counting the attempt; the code is deleted once used, expired or spent. */
  checkLoginCode(email: string, hash: string): Promise<CodeCheck>
}

/** Tally bottles held by these orders right now. */
export function tallyReserved(orders: Order[], now = Date.now()): Reserved {
  const out: Reserved = {}
  for (const o of orders) {
    const holding = o.status === 'pending' && now - new Date(o.createdAt).getTime() < HOLD_MS
    if (!RESERVING.includes(o.status) && !holding) continue
    for (const l of o.totals.lines) out[l.variantId] = (out[l.variantId] ?? 0) + l.qty
  }
  return out
}

/** Aggregate raw events (file store; Postgres does the same in SQL). */
export function summarise(all: TrackEvent[], since: Date): EventStats {
  const inRange = all.filter((e) => e.at && new Date(e.at) >= since)
  const views = inRange.filter((e) => e.name === 'page_view')
  const uniq = (xs: string[]) => new Set(xs).size
  const top = (rows: TrackEvent[], key: (e: TrackEvent) => string | undefined, distinctVisitors = true, limit = 10) => {
    const m = new Map<string, Set<string> | number>()
    for (const e of rows) {
      const k = key(e)
      if (!k) continue
      if (distinctVisitors) {
        const set = (m.get(k) as Set<string>) ?? new Set<string>()
        set.add(e.vid)
        m.set(k, set)
      } else m.set(k, ((m.get(k) as number) ?? 0) + 1)
    }
    return [...m.entries()]
      .map(([k, v]) => ({ key: k, n: typeof v === 'number' ? v : v.size }))
      .sort((a, b) => b.n - a.n)
      .slice(0, limit)
  }
  const days = new Map<string, { v: Set<string>; n: number }>()
  for (const e of views) {
    const d = e.at!.slice(0, 10)
    const row = days.get(d) ?? { v: new Set<string>(), n: 0 }
    row.v.add(e.vid)
    row.n++
    days.set(d, row)
  }
  const counts: Record<string, number> = {}
  const reachSets: Record<string, Set<string>> = {}
  for (const e of inRange) {
    counts[e.name] = (counts[e.name] ?? 0) + 1
    ;(reachSets[e.name] ??= new Set()).add(e.vid)
  }
  const prod = new Map<string, { views: number; adds: number }>()
  for (const e of inRange) {
    if (!e.slug) continue
    const p = prod.get(e.slug) ?? { views: 0, adds: 0 }
    if (e.name === 'product_view') p.views++
    if (e.name === 'add_to_bag') p.adds++
    prod.set(e.slug, p)
  }
  return {
    since: since.toISOString(),
    visitors: uniq(inRange.map((e) => e.vid)),
    sessions: uniq(inRange.map((e) => e.sid)),
    pageViews: views.length,
    byDay: [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, r]) => ({ day, visitors: r.v.size, views: r.n })),
    topPages: top(views, (e) => e.path, false),
    sources: top(inRange, (e) => e.source || 'Direct'),
    devices: top(inRange, (e) => e.device),
    places: top(inRange, (e) => (e.city ? `${e.city}${e.country ? `, ${e.country}` : ''}` : e.country)),
    events: counts,
    reach: Object.fromEntries(Object.entries(reachSets).map(([k, v]) => [k, v.size])),
    products: [...prod.entries()].map(([slug, p]) => ({ slug, ...p })).sort((a, b) => b.views - a.views),
  }
}
