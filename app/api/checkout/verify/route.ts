import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOrder, markPaid } from '@/lib/orders'
import { rateLimit, tooMany } from '@/lib/rate-limit'
import { demoPaymentsEnabled, razorpayEnabled, verifyPaymentSignature } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

const Body = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('demo'), orderId: z.string().min(8).max(64) }),
  z.object({
    mode: z.literal('razorpay'),
    orderId: z.string().min(8).max(64),
    razorpay_order_id: z.string().min(4).max(64),
    razorpay_payment_id: z.string().min(4).max(64),
    razorpay_signature: z.string().min(16).max(256),
  }),
])

export async function POST(req: Request) {
  if (!rateLimit(req, 'verify', 30, 10 * 60_000)) return tooMany()
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const input = parsed.data

  const order = await getOrder(input.orderId)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'paid' || order.status === 'dispatched' || order.status === 'delivered') {
    return NextResponse.json({ ok: true, orderId: order.id })
  }
  if (order.status === 'cancelled') return NextResponse.json({ error: 'This order was cancelled' }, { status: 409 })

  if (input.mode === 'demo') {
    // Demo payments are only possible when no live gateway is configured.
    if (!demoPaymentsEnabled() || razorpayEnabled() || order.payment.provider !== 'demo') {
      return NextResponse.json({ error: 'Demo payments are disabled' }, { status: 403 })
    }
    await markPaid(order.id)
    return NextResponse.json({ ok: true, orderId: order.id })
  }

  if (order.payment.razorpayOrderId !== input.razorpay_order_id) {
    return NextResponse.json({ error: 'Payment does not match this order' }, { status: 400 })
  }
  if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    return NextResponse.json({ error: 'Payment signature could not be verified' }, { status: 400 })
  }
  await markPaid(order.id, { razorpayPaymentId: input.razorpay_payment_id })
  return NextResponse.json({ ok: true, orderId: order.id })
}
