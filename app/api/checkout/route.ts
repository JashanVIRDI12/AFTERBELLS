import { NextResponse } from 'next/server'
import { checkoutSchema } from '@/lib/checkout-schema'
import { priceLines } from '@/lib/pricing'
import { stockFrom } from '@/lib/stock'
import { getInventory } from '@/lib/inventory'
import { isFullSize } from '@/lib/catalog'
import { createOrder, markFailed, setRazorpayOrder } from '@/lib/orders'
import { storageDurable } from '@/lib/db'
import { createRazorpayOrder, demoPaymentsEnabled, razorpayEnabled, razorpayKeyId } from '@/lib/razorpay'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

type Shortfall = { error: string; variantId: string; remaining: number }

export async function POST(req: Request) {
  if (!rateLimit(req, 'checkout', 12, 10 * 60_000)) return tooMany()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json(
      { error: issue?.message ?? 'Please check your details', path: issue?.path ?? [] },
      { status: 422 },
    )
  }
  const input = parsed.data

  if (!razorpayEnabled() && !demoPaymentsEnabled()) {
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again shortly.' }, { status: 503 })
  }
  if (!storageDurable()) {
    // never take a payment we could lose: this host needs DATABASE_URL
    console.error('Checkout refused: no DATABASE_URL on a serverless host')
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again shortly.' }, { status: 503 })
  }

  // Prices always come from the catalogue — never from the browser.
  const totals = priceLines(input.lines, input.plan)
  if (!totals.lines.length) return NextResponse.json({ error: 'Your bag is empty' }, { status: 422 })
  // Razorpay's minimum is 100 paise (₹1)
  if (totals.dueNow < 1) return NextResponse.json({ error: 'Please check your bag and try again.' }, { status: 422 })

  // Limited stock: the stock check and the order hold happen as one locked step,
  // so two guests can never be sold the same last bottle.
  const inventory = await getInventory()
  const created = await createOrder<Shortfall>(
    {
      plan: totals.plan,
      totals,
      customer: { ...input.customer, email: input.customer.email.trim().toLowerCase() },
      gift: input.gift?.message ? { message: input.gift.message } : undefined,
      whatsappUpdates: input.whatsappUpdates || undefined,
      video: input.video && totals.lines.some((l) => isFullSize(l.variantId)) ? true : undefined,
      origin: input.origin && (input.origin.source || input.origin.campaign) ? input.origin : undefined,
      payment: { provider: razorpayEnabled() ? 'razorpay' : 'demo' },
    },
    (reserved) => {
      const stock = stockFrom(reserved, inventory)
      for (const l of totals.lines) {
        const remaining = stock[l.variantId]?.remaining ?? 0
        if (l.qty > remaining) {
          return {
            error:
              remaining === 0
                ? stock[l.variantId]?.paused
                  ? `${l.name} is not available just now. Please contact the concierge.`
                  : `${l.name} is now fully reserved.`
                : `Only a few ${l.name} bottles remain. Please reduce the quantity and try again.`,
            variantId: l.variantId,
            remaining,
          }
        }
      }
      return null
    },
  )
  if (!created.ok) return NextResponse.json(created.fail, { status: 409 })
  const order = created.order

  if (!razorpayEnabled()) {
    return NextResponse.json({ mode: 'demo', orderId: order.id, number: order.number, amount: totals.dueNow })
  }

  try {
    const rp = await createRazorpayOrder(totals.dueNow, order.number, {
      order_id: order.id,
      email: order.customer.email,
    })
    await setRazorpayOrder(order.id, rp.id)
    return NextResponse.json({
      mode: 'razorpay',
      orderId: order.id,
      number: order.number,
      keyId: razorpayKeyId(),
      razorpayOrderId: rp.id,
      amount: rp.amount,
      currency: rp.currency,
      prefill: { name: input.customer.name, email: input.customer.email, contact: input.customer.phone },
    })
  } catch (err) {
    console.error(err)
    await markFailed(order.id, 'gateway unreachable')
    return NextResponse.json({ error: 'We could not reach the payment gateway. Please try again.' }, { status: 502 })
  }
}
