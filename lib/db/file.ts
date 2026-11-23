import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { CODE_ATTEMPTS, leadKey, mergeLead, summarise, tallyReserved, type Lead, type Profile, type Feedback, type InventoryLog, type InventoryRow, type Order, type Store, type Subscriber, type TrackEvent } from './types'

/**
 * Local store: JSON files in /.data. For development, or a single long-running server with a
 * persistent disk. Production on serverless hosts uses Postgres (set DATABASE_URL).
 */
const DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data')
const file = (name: string) => path.join(DIR, `${name}.json`)

let queue: Promise<unknown> = Promise.resolve()
/** one writer at a time, so concurrent requests never clobber a file or oversell the edition */
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.catch(() => {})
  return run
}

/** A missing file is an empty list; anything else (corruption, permissions) must stop the write, never erase data. */
async function read<T>(name: string): Promise<T[]> {
  let raw: string
  try {
    raw = await fs.readFile(file(name), 'utf8')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw e
  }
  const data = JSON.parse(raw) as unknown
  if (!Array.isArray(data)) throw new Error(`${name}.json is not a list — refusing to overwrite it`)
  return data as T[]
}
async function write<T>(name: string, rows: T[]) {
  await fs.mkdir(DIR, { recursive: true })
  const tmp = `${file(name)}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2))
  await fs.rename(tmp, file(name))
}

const nextNumber = (orders: Order[]) => {
  const max = orders.reduce((m, o) => Math.max(m, Number(o.number.replace(/\D/g, '')) || 0), 1000)
  return `AB-${max + 1}`
}

export const fileStore: Store = {
  kind: 'file',

  createOrder(input, check) {
    return locked(async () => {
      const orders = await read<Order>('orders')
      const fail = check?.(tallyReserved(orders))
      if (fail) return { ok: false as const, fail }
      const now = new Date().toISOString()
      const order: Order = {
        ...input,
        id: crypto.randomBytes(12).toString('base64url'),
        number: nextNumber(orders),
        createdAt: now,
        updatedAt: now,
        status: 'pending',
        events: [{ at: now, type: 'created' }],
      }
      orders.push(order)
      await write('orders', orders)
      return { ok: true as const, order }
    })
  },

  async getOrder(id) {
    return (await read<Order>('orders')).find((o) => o.id === id)
  },
  async findByNumber(number) {
    const n = number.trim().toUpperCase()
    return (await read<Order>('orders')).find((o) => o.number === n)
  },
  async findByRazorpayOrder(rp) {
    return (await read<Order>('orders')).find((o) => o.payment.razorpayOrderId === rp)
  },
  async listOrders() {
    return read<Order>('orders')
  },

  updateOrder(id, mutate) {
    return locked(async () => {
      const orders = await read<Order>('orders')
      const i = orders.findIndex((o) => o.id === id)
      if (i === -1) return undefined
      const next = mutate(structuredClone(orders[i]))
      if (!next) return orders[i]
      orders[i] = { ...next, updatedAt: new Date().toISOString() }
      await write('orders', orders)
      return orders[i]
    })
  },

  async reservedByVariant() {
    return tallyReserved(await read<Order>('orders'))
  },

  addSubscriber(email, source) {
    return locked(async () => {
      const list = await read<Subscriber>('subscribers')
      if (list.some((s) => s.email === email)) return false
      list.push({ email, source, at: new Date().toISOString() })
      await write('subscribers', list)
      return true
    })
  },
  async listSubscribers() {
    return read<Subscriber>('subscribers')
  },

  removeSubscriber(email) {
    return locked(async () => {
      const list = await read<Subscriber>('subscribers')
      const next = list.filter((s) => s.email !== email)
      if (next.length === list.length) return false
      await write('subscribers', next)
      return true
    })
  },

  addFeedback(f) {
    return locked(async () => {
      const list = await read<Feedback>('feedback')
      list.push({ ...f, id: crypto.randomBytes(6).toString('hex'), at: new Date().toISOString() })
      await write('feedback', list)
    })
  },
  async listFeedback() {
    // older records had no id; their timestamp serves as one
    return (await read<Feedback>('feedback')).map((f) => ({ ...f, id: f.id ?? f.at }))
  },
  removeFeedback(id) {
    return locked(async () => {
      const list = await read<Feedback>('feedback')
      const next = list.filter((f) => (f.id ?? f.at) !== id)
      if (next.length === list.length) return false
      await write('feedback', next)
      return true
    })
  },
  publishFeedback(id, on) {
    return locked(async () => {
      const list = await read<Feedback>('feedback')
      const f = list.find((x) => (x.id ?? x.at) === id)
      if (!f || (on && !f.consent)) return false
      f.published = on
      await write('feedback', list)
      return true
    })
  },

  saveLead(input) {
    return locked(async () => {
      const list = await read<Lead>('leads')
      const key = leadKey(input)
      const i = list.findIndex((l) => leadKey(l) === key)
      const lead = mergeLead(list[i], input, new Date().toISOString(), crypto.randomBytes(8).toString('hex'))
      if (i === -1) list.push(lead)
      else list[i] = lead
      // the file store is for development: keep the newest 5,000
      await write('leads', list.slice(-5000))
      return lead
    })
  },
  async listLeads() {
    return (await read<Lead>('leads')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  setLeadStatus(id, status) {
    return locked(async () => {
      const list = await read<Lead>('leads')
      const l = list.find((x) => x.id === id)
      if (!l) return false
      l.status = status
      l.updatedAt = new Date().toISOString()
      await write('leads', list)
      return true
    })
  },
  removeLead(id) {
    return locked(async () => {
      const list = await read<Lead>('leads')
      const next = list.filter((l) => l.id !== id)
      if (next.length === list.length) return false
      await write('leads', next)
      return true
    })
  },

  async getInventory() {
    const rows = await read<InventoryRow>('inventory')
    return Object.fromEntries(rows.map((r) => [r.variantId, r]))
  },
  setInventory(row, change, note) {
    return locked(async () => {
      const rows = (await read<InventoryRow>('inventory')).filter((r) => r.variantId !== row.variantId)
      const at = new Date().toISOString()
      rows.push({ ...row, updatedAt: at })
      await write('inventory', rows)
      const log = await read<InventoryLog>('inventory-log')
      log.push({ at, variantId: row.variantId, change, ...(note ? { note } : {}) })
      await write('inventory-log', log)
    })
  },
  async listInventoryLog(limit = 50) {
    return (await read<InventoryLog>('inventory-log')).reverse().slice(0, limit)
  },

  addEvent(e) {
    return locked(async () => {
      const list = await read<TrackEvent>('events')
      list.push({ ...e, at: new Date().toISOString() })
      // the file store is for development: keep the newest 20,000 events
      await write('events', list.slice(-20000))
    })
  },
  async eventStats(since) {
    return summarise(await read<TrackEvent>('events'), since)
  },

  async health() {
    await fs.mkdir(DIR, { recursive: true })
    await fs.access(DIR)
  },

  async listOrdersByEmail(email) {
    const e = email.trim().toLowerCase()
    return (await read<Order>('orders')).filter((o) => o.customer.email.toLowerCase() === e).reverse()
  },

  async getProfile(email) {
    const e = email.trim().toLowerCase()
    return (await read<Profile>('profiles')).find((p) => p.email === e)
  },
  saveProfile(input) {
    return locked(async () => {
      const list = await read<Profile>('profiles')
      const email = input.email.trim().toLowerCase()
      const i = list.findIndex((p) => p.email === email)
      const now = new Date().toISOString()
      const profile: Profile = { ...input, email, createdAt: i === -1 ? now : list[i].createdAt, updatedAt: now }
      if (i === -1) list.push(profile)
      else list[i] = profile
      await write('profiles', list)
      return profile
    })
  },

  putLoginCode(email, hash, expiresAt) {
    return locked(async () => {
      const list = (await read<LoginCode>('login-codes')).filter((c) => c.email !== email && new Date(c.expiresAt).getTime() > Date.now())
      list.push({ email, hash, expiresAt: expiresAt.toISOString(), attempts: 0 })
      await write('login-codes', list)
    })
  },
  checkLoginCode(email, hash) {
    return locked(async () => {
      const list = await read<LoginCode>('login-codes')
      const i = list.findIndex((c) => c.email === email)
      if (i === -1) return 'none' as const
      const c = list[i]
      const drop = async () => {
        list.splice(i, 1)
        await write('login-codes', list)
      }
      if (new Date(c.expiresAt).getTime() < Date.now() || c.attempts >= CODE_ATTEMPTS) {
        await drop()
        return 'expired' as const
      }
      const a = Buffer.from(c.hash)
      const b = Buffer.from(hash)
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        await drop()
        return 'ok' as const
      }
      c.attempts++
      await write('login-codes', list)
      return 'wrong' as const
    })
  },
}

type LoginCode = { email: string; hash: string; expiresAt: string; attempts: number }
