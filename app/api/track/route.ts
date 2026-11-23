import { z } from 'zod'
import { products } from '@/lib/catalog'
import { TRACK_NAMES } from '@/lib/track-names'
import { getStore } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// every product, so adds of the 15 ml bottles and the gift set are counted too
const slugs = products.map((p) => p.slug) as [string, ...string[]]
const id = z.string().regex(/^[a-z0-9]{8,32}$/i)
const text = z.string().trim().max(80).optional()

const Body = z.object({
  name: z.enum(TRACK_NAMES),
  vid: id,
  sid: id,
  path: z.string().max(200).startsWith('/'),
  slug: z.enum(slugs).optional(),
  source: text,
  medium: text,
  campaign: text,
  device: z.enum(['Phone', 'Tablet', 'Desktop']).optional(),
})

const header = (req: Request, ...names: string[]) => {
  for (const n of names) {
    const v = req.headers.get(n)
    if (v) {
      try {
        return decodeURIComponent(v).slice(0, 60)
      } catch {
        return v.slice(0, 60)
      }
    }
  }
  return undefined
}

/** Anonymous visit events. Location is the host's own estimate (Vercel / Cloudflare); the IP is never stored. */
export async function POST(req: Request) {
  if (!rateLimit(req, 'track', 120, 60_000)) return new Response(null, { status: 204 })
  if (/bot|crawl|spider|headless|lighthouse/i.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 })
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success || parsed.data.path.startsWith('/admin')) return new Response(null, { status: 204 })
  try {
    await (await getStore()).addEvent({
      ...parsed.data,
      country: header(req, 'x-vercel-ip-country', 'cf-ipcountry'),
      city: header(req, 'x-vercel-ip-city'),
    })
  } catch (e) {
    console.error('track failed', e)
  }
  return new Response(null, { status: 204 })
}
