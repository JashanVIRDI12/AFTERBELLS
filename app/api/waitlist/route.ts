import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStore, storageDurable, storageUnavailable } from '@/lib/db'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const INTERESTS = ['amber-hour', 'open-sky', 'iron-crown', 'undecided'] as const
const short = (n: number) => z.string().trim().max(n).optional()

const Body = z
  .object({
    name: short(80),
    email: z.union([z.literal(''), z.email('Enter a valid email address').max(120)]).optional(),
    phone: z
      .string()
      .transform((s) => s.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
      .pipe(z.union([z.literal(''), z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number')]))
      .optional(),
    interests: z.array(z.enum(INTERESTS)).max(4).optional(),
    origin: z.object({ source: short(80), medium: short(80), campaign: short(80) }).optional(),
    /** honeypot */
    website: z.string().max(200).optional(),
  })
  .refine((b) => b.email || b.phone, { message: 'Enter your email or WhatsApp number' })

/**
 * A place on the waitlist, kept in the database: /admin → Leads → Waitlist, or as a file for Excel at
 * /api/admin/export?type=waitlist. A second step adds the name and favourite hours to the same entry.
 */
export async function POST(req: Request) {
  if (!rateLimit(req, 'waitlist', 8, 10 * 60_000)) return tooMany()
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check the details' }, { status: 422 })
  }
  const { website, interests, origin, ...b } = parsed.data
  if (website) return NextResponse.json({ ok: true })
  if (!storageDurable()) return storageUnavailable('Waitlist')

  const email = b.email ? b.email.trim().toLowerCase() : undefined
  const phone = b.phone || undefined
  const name = b.name || undefined
  const store = await getStore()
  await store.saveLead({
    kind: 'waitlist',
    email,
    phone,
    name,
    interests: interests?.length ? interests : undefined,
    path: '/waitlist',
    origin: origin && (origin.source || origin.campaign) ? origin : undefined,
  })
  if (email) await store.addSubscriber(email, 'waitlist')

  return NextResponse.json({ ok: true })
}
