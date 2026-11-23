import { NextResponse } from 'next/server'
import { z } from 'zod'
import { allFragrances, fragrances, getVariant } from '@/lib/catalog'
import { sendMatchEmail } from '@/lib/email'
import { getStore, storageDurable, storageUnavailable } from '@/lib/db'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const slugs = allFragrances.map((f) => f.slug) as [string, ...string[]]
const short = (n: number) => z.string().trim().max(n).optional()
const phone = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'))

const Body = z
  .object({
    kind: z.enum(['checkout', 'finder', 'notify', 'salon']),
    email: z.email('Enter a valid email address').max(120).optional(),
    phone: phone.optional(),
    name: short(80),
    pin: z.string().regex(/^[1-9]\d{5}$/).optional(),
    city: short(60),
    lines: z
      .array(z.object({ variantId: z.string().max(60), qty: z.number().int().min(1).max(10) }))
      .max(10)
      .optional(),
    /** fragrance slug (finder) or variant id (notify) */
    about: short(60),
    path: z.string().max(200).startsWith('/').optional(),
    origin: z.object({ source: short(80), medium: short(80), campaign: short(80) }).optional(),
    /** also add the email to the house letters */
    salon: z.boolean().optional(),
    /** honeypot */
    website: z.string().max(200).optional(),
  })
  .refine((b) => b.email || b.phone, { message: 'Enter your email or mobile number' })

/**
 * Leads: contact details left without an order (checkout drafts, finder results, "tell me" requests,
 * WhatsApp sign-ups). The concierge follows them up from /admin → Leads.
 */
export async function POST(req: Request) {
  if (!rateLimit(req, 'lead', 30, 10 * 60_000)) return tooMany()
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check the details' }, { status: 422 })
  }
  const { website, salon, lines, about, ...b } = parsed.data
  if (website) return NextResponse.json({ ok: true })
  if (!storageDurable()) return storageUnavailable('Lead')

  // only real bag lines and real fragrances are kept
  const bag = lines?.filter((l) => getVariant(l.variantId))
  const total = bag?.reduce((n, l) => n + (getVariant(l.variantId)?.variant.price ?? 0) * l.qty, 0)
  const known = about && (slugs.includes(about) || getVariant(about)) ? about : undefined

  const store = await getStore()
  // an email for the house letters is a Salon member, not a lead to follow up
  if (b.kind === 'salon' && b.email) {
    await store.addSubscriber(b.email.trim().toLowerCase(), 'salon')
    return NextResponse.json({ ok: true })
  }
  await store.saveLead({
    ...b,
    email: b.email?.trim().toLowerCase(),
    ...(bag?.length ? { lines: bag, total } : {}),
    ...(known ? { about: known } : {}),
  })
  if (salon && b.email) await store.addSubscriber(b.email.trim().toLowerCase(), b.kind === 'salon' ? 'salon' : b.kind)
  // a finder result asked for by email goes out at once (when email is set up); WhatsApp is sent by the concierge
  const match = b.kind === 'finder' && b.email ? fragrances.find((f) => f.slug === known) : undefined
  if (match) await sendMatchEmail(b.email!, { ...match, price: match.variants[0].price })
  return NextResponse.json({ ok: true })
}
