import { NextResponse } from 'next/server'
import { findByRazorpayOrder, markFailed, markPaid, markRefundStatus } from '@/lib/orders'
import { verifyWebhookSignature } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

/**
 * Razorpay webhook (Dashboard → Webhooks → https://<your-domain>/api/razorpay/webhook).
 * Events: payment.captured, order.paid, payment.failed, refund.processed, refund.failed.
 * The safety net when a guest closes the tab before the browser confirms payment.
 */
export async function POST(req: Request) {
  const raw = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: 'bad signature' }, { status: 401 })

  type Evt = {
    event: string
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } }
      order?: { entity?: { id?: string } }
      refund?: { entity?: { id?: string; status?: string } }
    }
  }
  let evt: Evt
  try {
    evt = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 })
  }

  const rpOrderId = evt.payload?.payment?.entity?.order_id ?? evt.payload?.order?.entity?.id
  if (!rpOrderId) return NextResponse.json({ ok: true })
  const order = await findByRazorpayOrder(rpOrderId)
  if (!order) return NextResponse.json({ ok: true })

  if (evt.event === 'payment.captured' || evt.event === 'order.paid') {
    await markPaid(order.id, { razorpayPaymentId: evt.payload?.payment?.entity?.id ?? order.payment.razorpayPaymentId })
  } else if (evt.event === 'payment.failed') {
    await markFailed(order.id, 'payment.failed')
  } else if (evt.event.startsWith('refund.')) {
    const r = evt.payload?.refund?.entity
    if (r?.id) await markRefundStatus(order.id, r.id, r.status ?? evt.event.slice(7))
  }
  return NextResponse.json({ ok: true })
}
