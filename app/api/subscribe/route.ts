import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStore } from '@/lib/db'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const Body = z.object({
  email: z.email('Please enter a valid email address').max(120),
  /** honeypot: people never see this field; bots fill it */
  website: z.string().max(200).optional(),
  /** which list: the Salon letters, or the discovery-set waitlist */
  list: z.enum(['salon', 'discovery']).optional(),
})

export async function POST(req: Request) {
  if (!rateLimit(req, 'subscribe', 6, 10 * 60_000)) return tooMany()
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid email' }, { status: 422 })
  }
  if (parsed.data.website) return NextResponse.json({ ok: true })
  await (await getStore()).addSubscriber(parsed.data.email.trim().toLowerCase(), parsed.data.list ?? 'salon')
  return NextResponse.json({ ok: true })
}
