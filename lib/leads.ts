'use client'

import { visitOrigin } from './track'
import type { LeadKind } from './db/types'

export type LeadBody = {
  kind: LeadKind
  email?: string
  phone?: string
  name?: string
  pin?: string
  city?: string
  lines?: { variantId: string; qty: number }[]
  about?: string
  salon?: boolean
  website?: string
}

/** Sends a lead to the house. Never throws. */
export async function sendLead(body: LeadBody, opts: { keepalive?: boolean } = {}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, path: location.pathname.slice(0, 200), origin: visitOrigin() }),
      keepalive: opts.keepalive,
    })
    if (res.ok) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data.error ?? 'Something went wrong. Please try again.' }
  } catch {
    return { ok: false, error: 'Could not reach the house. Check your connection and try again.' }
  }
}

/* The browser remembers that this guest has already left their details, so the house does not ask again. */
const KNOWN = 'ab-known'
export function markKnown() {
  try {
    localStorage.setItem(KNOWN, String(Date.now()))
  } catch {}
}
export function isKnown() {
  try {
    return Boolean(localStorage.getItem(KNOWN))
  } catch {
    return false
  }
}

/** Ten-digit Indian mobile, from whatever the guest typed (+91, spaces, a leading 0). */
export const cleanPhone = (s: string) => s.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '')
export const validPhone = (s: string) => /^[6-9]\d{9}$/.test(cleanPhone(s))
export const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
