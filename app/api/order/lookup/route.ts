import { NextResponse } from 'next/server'
import { z } from 'zod'
import { findOrderForGuest } from '@/lib/orders'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const Body = z.object({
  number: z.string().trim().min(3).max(20),
  email: z.email('Please enter the email used for your order').max(120),
})

/** "Track your order": order number + the email it was placed with. */
export async function POST(req: Request) {
  if (!rateLimit(req, 'lookup', 10, 10 * 60_000)) return tooMany()
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your details' }, { status: 422 })
  }
  const raw = parsed.data.number.toUpperCase().replace(/\s+/g, '')
  const number = /^\d+$/.test(raw) ? `AB-${raw}` : raw.replace(/^AB(?=\d)/, 'AB-')
  const order = await findOrderForGuest(number, parsed.data.email)
  if (!order) {
    return NextResponse.json(
      { error: 'We could not find an order with that number and email. Please check both and try again.' },
      { status: 404 },
    )
  }
  return NextResponse.json({ url: `/order/${order.id}` })
}
