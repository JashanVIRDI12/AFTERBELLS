import 'server-only'
import crypto from 'node:crypto'

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? ''

export const razorpayEnabled = () => Boolean(KEY_ID && KEY_SECRET)
/** Demo completion is available only in local development with explicit opt-in. */
export const demoPaymentsEnabled = () => process.env.NODE_ENV === 'development' && process.env.ALLOW_DEMO_PAYMENTS === 'true'
export const razorpayKeyId = () => KEY_ID

/** Creates a Razorpay order. `amount` is in rupees. */
export async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt, notes }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay order failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return (await res.json()) as { id: string; amount: number; currency: string }
}

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqual(expected, signature)
}

/** Webhook signature: HMAC_SHA256(raw body, webhook_secret) */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqual(expected, signature)
}

/** Full or partial refund of a captured payment. `amount` is in rupees. */
export async function refundPayment(paymentId: string, amount: number, notes: Record<string, string>) {
  if (!razorpayEnabled()) throw new Error('Razorpay is not configured')
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify({ amount: Math.round(amount * 100), speed: 'normal', notes }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay refund failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return (await res.json()) as { id: string; amount: number; status: string }
}
