import crypto from 'node:crypto'
import { site } from './site'

/**
 * The pre-opening lock. While on, visitors see /waitlist; the owner enters with a password and gets a cookie.
 * Kept free of server-only imports so the proxy (proxy.ts) can use it.
 */
export const PREVIEW_COOKIE = 'ab_preview'
export const PREVIEW_DAYS = 30

/** On unless SITE_LOCKED=false (or 0), or `site.prelaunch.locked` is false. */
export function siteLocked() {
  const env = process.env.SITE_LOCKED?.trim().toLowerCase()
  if (env === 'false' || env === '0' || env === 'off') return false
  if (env === 'true' || env === '1' || env === 'on') return true
  return site.prelaunch.locked
}

/**
 * The owner's password: PREVIEW_PASSWORD, else ADMIN_PASSWORD.
 * In local development only, with neither set, it is "afterbells" so the site can still be opened.
 */
export function previewPassword(): string | null {
  const p = process.env.PREVIEW_PASSWORD || process.env.ADMIN_PASSWORD
  if (p) return p
  return process.env.NODE_ENV === 'production' ? null : 'afterbells'
}

/** What the owner's cookie holds: a signature of the password (changing the password signs everyone out). */
export function previewToken(): string | null {
  const p = previewPassword()
  if (!p) return null
  return crypto.createHmac('sha256', process.env.AUTH_SECRET || 'after-bells-preview').update(`preview:${p}`).digest('base64url')
}

export function validPreview(cookie: string | undefined) {
  const t = previewToken()
  if (!t || !cookie || cookie.length !== t.length) return false
  return crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(t))
}

export function passwordMatches(given: string) {
  const p = previewPassword()
  if (!p) return false
  const a = crypto.createHash('sha256').update(given).digest()
  const b = crypto.createHash('sha256').update(p).digest()
  return crypto.timingSafeEqual(a, b)
}

/** Always reachable while locked: the waitlist, the fine print, the owner's way in, and what the house runs on. */
const OPEN_PAGES = ['/waitlist', '/policies']
const OPEN_API = ['/api/waitlist', '/api/preview', '/api/track', '/api/health', '/api/razorpay/webhook', '/api/admin']

export function openWhileLocked(path: string) {
  if (path === '/admin' || path.startsWith('/admin/')) return true
  if (OPEN_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return true
  return OPEN_API.some((p) => path === p || path.startsWith(`${p}/`))
}
