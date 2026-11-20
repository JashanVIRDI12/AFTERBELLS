import 'server-only'
import crypto from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getStore, type Order } from './db'
import { rateLimit } from './rate-limit'

/**
 * Client accounts. No passwords: a client signs in with a six-digit code sent to their email,
 * and stays signed in through a signed, HTTP-only cookie. Orders belong to an account by email,
 * so every order placed with that address appears there, including ones made before signing up.
 *
 * Production needs AUTH_SECRET (32+ random characters), e.g. `openssl rand -hex 32`.
 */

const COOKIE = 'ab_session'
const SESSION_DAYS = 30
const CODE_MINUTES = 10

const g = globalThis as typeof globalThis & { __abDevSecret?: string }

function secret() {
  const s = process.env.AUTH_SECRET
  if (s && s.length >= 32) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Client accounts need AUTH_SECRET: 32 or more random characters (openssl rand -hex 32)')
  }
  // development only: a secret for this server process, so sign-ins reset when the server restarts
  g.__abDevSecret ??= crypto.randomBytes(32).toString('hex')
  return g.__abDevSecret
}

const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('base64url')
const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))

export const normaliseEmail = (e: string) => e.trim().toLowerCase()

/** Only send people back to a page on this site. */
export function safeNext(next: string | null | undefined, fallback = '/account') {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/account/sign-in') ? next : fallback
}

/** The signed-in client's email, or null. */
export async function getSession(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  const [body, sig] = raw.split('.')
  if (!body || !sig || !same(sig, sign(body))) return null
  try {
    const { e, x } = JSON.parse(Buffer.from(body, 'base64url').toString()) as { e?: unknown; x?: unknown }
    return typeof e === 'string' && typeof x === 'number' && x > Date.now() ? e : null
  } catch {
    return null
  }
}

/** Server Actions only (cookies cannot be set while a page renders). */
export async function startSession(email: string) {
  const body = Buffer.from(JSON.stringify({ e: normaliseEmail(email), x: Date.now() + SESSION_DAYS * 86_400_000 })).toString('base64url')
  ;(await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

/** For account pages: the signed-in email, or off to sign in (and back here afterwards). */
export async function requireMember(back: string) {
  const email = await getSession()
  if (!email) redirect(`/account/sign-in?next=${encodeURIComponent(back)}`)
  return email
}

const codeHash = (email: string, code: string) => sign(`code:${normaliseEmail(email)}:${code}`)

/** A fresh six-digit code for this email (any earlier one stops working). Returns it so it can be sent. */
export async function issueCode(email: string) {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  await (await getStore()).putLoginCode(normaliseEmail(email), codeHash(email, code), new Date(Date.now() + CODE_MINUTES * 60_000))
  return code
}

export async function checkCode(email: string, code: string) {
  return (await getStore()).checkLoginCode(normaliseEmail(email), codeHash(email, code))
}

/** Rate limit for Server Actions, keyed by the caller's address like the API routes. */
export async function allowed(bucket: string, max: number, windowMs: number) {
  return rateLimit(new Request('http://local/', { headers: await headers() }), bucket, max, windowMs)
}

/** Orders a client can see: paid, on the way, delivered or cancelled. Newest first. */
export const visibleOrders = (orders: Order[]) => orders.filter((o) => o.status !== 'pending' && o.status !== 'failed')

/** Everything the account pages show for one client. */
export async function memberData(email: string) {
  const store = await getStore()
  const [profile, all] = await Promise.all([store.getProfile(email), store.listOrdersByEmail(email)])
  const orders = visibleOrders(all)
  // until they save a profile, offer the details from their most recent reservation
  const fallback = (orders[0] ?? all[0])?.customer
  return { profile, orders, fallback }
}

export const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Awaiting payment',
  failed: 'Payment not completed',
  paid: 'Confirmed',
  dispatched: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** The address fields shared by a profile, an order's customer and the checkout form. */
export function detailsOf(d?: { name: string; phone: string; address1: string; address2?: string; city: string; state: string; pin: string }) {
  return {
    name: d?.name ?? '',
    phone: d?.phone ?? '',
    address1: d?.address1 ?? '',
    address2: d?.address2 ?? '',
    city: d?.city ?? '',
    state: d?.state ?? '',
    pin: d?.pin ?? '',
  }
}
