'use client'

/**
 * First-party, anonymous visit measurement. A random visitor id lives in this browser only;
 * no names, emails or IP addresses are sent. Respects Do Not Track / Global Privacy Control.
 */
export type TrackName =
  | 'page_view'
  | 'product_view'
  | 'add_to_bag'
  | 'checkout_view'
  | 'payment_start'
  | 'concierge_call'
  | 'concierge_whatsapp'
  | 'discovery_waitlist'
  | 'instagram_click'
  | 'salon_join'
  | 'film_play'
  | 'track_lookup'

const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

function store(kind: 'local' | 'session', key: string, make: () => string) {
  try {
    const s = kind === 'local' ? localStorage : sessionStorage
    let v = s.getItem(key)
    if (!v) {
      v = make()
      s.setItem(key, v)
    }
    return v
  } catch {
    return make()
  }
}

function optedOut() {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean }
  return n.doNotTrack === '1' || n.globalPrivacyControl === true || /bot|crawl|spider|headless|lighthouse/i.test(n.userAgent)
}

/** Where this visit came from: campaign tags first, else the referring site (first touch per session). */
export function visitOrigin() {
  if (typeof window === 'undefined') return { source: '', medium: '', campaign: '' }
  return origin()
}

function origin() {
  const raw = store('session', 'ab-src', () => {
    const q = new URLSearchParams(location.search)
    let source = q.get('utm_source') ?? ''
    if (!source && document.referrer) {
      try {
        const host = new URL(document.referrer).hostname.replace(/^www\./, '')
        if (host !== location.hostname) source = host.includes('instagram') ? 'Instagram' : host.includes('google') ? 'Google' : host.includes('facebook') ? 'Facebook' : host.includes('whatsapp') || host === 'wa.me' ? 'WhatsApp' : host
      } catch {}
    }
    return JSON.stringify({ source, medium: q.get('utm_medium') ?? '', campaign: q.get('utm_campaign') ?? '' })
  })
  try {
    return JSON.parse(raw) as { source: string; medium: string; campaign: string }
  } catch {
    return { source: '', medium: '', campaign: '' }
  }
}

const device = () => (innerWidth < 768 ? 'Phone' : innerWidth < 1100 ? 'Tablet' : 'Desktop')

export function track(name: TrackName, extra: { slug?: string } = {}) {
  if (typeof window === 'undefined' || optedOut() || location.pathname.startsWith('/admin')) return
  const o = origin()
  const body = JSON.stringify({
    name,
    vid: store('local', 'ab-vid', rid),
    sid: store('session', 'ab-sid', rid),
    path: location.pathname.slice(0, 200),
    ...(extra.slug ? { slug: extra.slug } : {}),
    ...(o.source ? { source: o.source.slice(0, 80) } : {}),
    ...(o.medium ? { medium: o.medium.slice(0, 80) } : {}),
    ...(o.campaign ? { campaign: o.campaign.slice(0, 80) } : {}),
    device: device(),
  })
  try {
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return
  } catch {}
  void fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
