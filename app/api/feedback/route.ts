import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fragrances } from '@/lib/catalog'
import { getStore } from '@/lib/db'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const slugs = fragrances.map((f) => f.slug) as [string, ...string[]]
const rating = z.number().int().min(1).max(5)

const Body = z.object({
  fragrance: z.array(z.enum(slugs)).min(1, 'Tell us which fragrance you received'),
  scent: rating,
  longevity: rating,
  packaging: rating,
  comments: z.string().trim().max(2000).optional().default(''),
  name: z.string().trim().max(80).optional().default(''),
  orderNumber: z.string().trim().max(20).optional().default(''),
  consent: z.boolean().optional().default(false),
  /** honeypot */
  website: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  if (!rateLimit(req, 'feedback', 6, 10 * 60_000)) return tooMany()
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check the form' }, { status: 422 })
  }
  const { website, ...feedback } = parsed.data
  if (website) return NextResponse.json({ ok: true })
  await (await getStore()).addFeedback(feedback)
  return NextResponse.json({ ok: true })
}
