import 'server-only'

/**
 * A small sliding-window limiter for public forms. Per server instance — enough to blunt
 * scripted abuse; payment safety itself never relies on it.
 */
const hits = new Map<string, number[]>()

export function clientIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd?.split(',')[0] || req.headers.get('x-real-ip') || 'local').trim()
}

/** true when this request is allowed */
export function rateLimit(req: Request, bucket: string, max: number, windowMs: number) {
  const key = `${bucket}:${clientIp(req)}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    // keep memory bounded
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
  return true
}

export const tooMany = () =>
  Response.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 })
