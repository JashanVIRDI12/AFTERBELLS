import 'server-only'
import { getStore, type NewOrder, type Order, type Reserved } from './db'

export type { Customer, Order, OrderStatus, OrderEvent } from './db'

/**
 * Everything the site does with orders goes through here. Storage is chosen in lib/db
 * (Postgres in production, JSON files locally); transitions are atomic in both.
 */

const stamp = (o: Order, type: string, note?: string) => {
  o.events = [...(o.events ?? []), { at: new Date().toISOString(), type, ...(note ? { note } : {}) }]
  return o
}

export async function listOrders() {
  return (await getStore()).listOrders()
}
export async function getOrder(id: string) {
  return (await getStore()).getOrder(id)
}
export async function findByRazorpayOrder(razorpayOrderId: string) {
  return (await getStore()).findByRazorpayOrder(razorpayOrderId)
}
/** For "track your order": the number and the email must both match. */
export async function findOrderForGuest(number: string, email: string) {
  const o = await (await getStore()).findByNumber(number)
  if (!o || o.status === 'pending' || o.status === 'failed') return undefined
  return o.customer.email.trim().toLowerCase() === email.trim().toLowerCase() ? o : undefined
}
export async function reservedByVariant(): Promise<Reserved> {
  return (await getStore()).reservedByVariant()
}

/** Creates a pending order; `check` sees the stock held at that instant and can refuse. */
export async function createOrder<F>(input: NewOrder, check?: (reserved: Reserved) => F | null) {
  return (await getStore()).createOrder(input, check)
}

export async function setRazorpayOrder(id: string, razorpayOrderId: string) {
  return (await getStore()).updateOrder(id, (o) => {
    o.payment = { ...o.payment, provider: 'razorpay', razorpayOrderId }
    return o
  })
}

export async function markFailed(id: string, note?: string) {
  return (await getStore()).updateOrder(id, (o) => (o.status === 'pending' ? stamp({ ...o, status: 'failed' }, 'payment-failed', note) : null))
}

/** Marks an order paid (idempotent) and sends the confirmation emails once. */
export async function markPaid(id: string, payment?: Partial<Order['payment']>, opts: { email?: boolean; note?: string } = {}) {
  const store = await getStore()
  const updated = await store.updateOrder(id, (o) => {
    if (o.status !== 'pending' && o.status !== 'failed') return null
    o.status = 'paid'
    o.payment = { ...o.payment, ...payment, paidAt: new Date().toISOString() }
    return stamp(o, 'paid', opts.note)
  })
  if (opts.email === false) return updated
  if (updated && updated.status === 'paid' && !updated.emailedAt) {
    const { sendOrderEmails } = await import('./email')
    if (await sendOrderEmails(updated)) {
      await store.updateOrder(id, (o) => ({ ...o, emailedAt: new Date().toISOString() }))
    }
  }
  return updated
}

export type Dispatch = { courier: string; tracking: string; trackingUrl?: string }

/** paid → dispatched (or correct the tracking of an order already dispatched). Emails the guest. */
export async function markDispatched(id: string, d: Dispatch, notify = true) {
  const updated = await (await getStore()).updateOrder(id, (o) => {
    if (o.status !== 'paid' && o.status !== 'dispatched') return null
    const first = o.status === 'paid'
    o.status = 'dispatched'
    o.fulfilment = {
      ...o.fulfilment,
      courier: d.courier,
      tracking: d.tracking,
      trackingUrl: d.trackingUrl || undefined,
      dispatchedAt: o.fulfilment?.dispatchedAt ?? new Date().toISOString(),
    }
    return stamp(o, first ? 'dispatched' : 'tracking-updated', `${d.courier} ${d.tracking}`)
  })
  if (updated?.status === 'dispatched' && notify) {
    const { sendDispatchEmail } = await import('./email')
    await sendDispatchEmail(updated)
  }
  return updated
}

export async function markDelivered(id: string) {
  return (await getStore()).updateOrder(id, (o) => {
    if (o.status !== 'dispatched') return null
    o.status = 'delivered'
    o.fulfilment = { ...o.fulfilment, deliveredAt: new Date().toISOString() }
    return stamp(o, 'delivered')
  })
}

export class OrderActionError extends Error {}

/**
 * Cancels an order and, when asked, refunds the payment in full through Razorpay.
 * The bottle returns to the edition immediately.
 */
export async function cancelOrder(id: string, opts: { refund: boolean; reason?: string }) {
  const store = await getStore()
  const current = await store.getOrder(id)
  if (!current) throw new OrderActionError('Order not found')
  if (current.status === 'cancelled' || current.status === 'delivered') {
    throw new OrderActionError(`A ${current.status} order cannot be cancelled here`)
  }
  let refund: Order['refund']
  const paid = current.status === 'paid' || current.status === 'dispatched'
  if (opts.refund && paid) {
    if (current.payment.provider === 'razorpay' && current.payment.razorpayPaymentId) {
      const { refundPayment } = await import('./razorpay')
      const r = await refundPayment(current.payment.razorpayPaymentId, current.totals.dueNow, {
        order: current.number,
        reason: opts.reason ?? '',
      })
      refund = { id: r.id, amount: r.amount / 100, status: r.status, at: new Date().toISOString() }
    } else {
      // demo orders, or payments taken outside Razorpay: record it, refund by hand
      refund = { amount: current.totals.dueNow, status: 'manual', at: new Date().toISOString() }
    }
  }
  const updated = await store.updateOrder(id, (o) => {
    if (o.status === 'cancelled' || o.status === 'delivered') return null
    o.status = 'cancelled'
    o.cancelledAt = new Date().toISOString()
    if (refund) o.refund = refund
    return stamp(o, refund ? 'cancelled-refunded' : 'cancelled', opts.reason)
  })
  if (updated && paid) {
    const { sendCancellationEmail } = await import('./email')
    await sendCancellationEmail(updated)
  }
  return updated
}

/** Razorpay tells us a refund settled (webhook). */
export async function markRefundStatus(id: string, refundId: string, status: string) {
  return (await getStore()).updateOrder(id, (o) => {
    if (!o.refund || (o.refund.id && o.refund.id !== refundId)) return null
    if (o.refund.status === status) return null
    o.refund = { ...o.refund, id: refundId, status }
    return stamp(o, `refund-${status}`)
  })
}

export async function setNote(id: string, note: string) {
  return (await getStore()).updateOrder(id, (o) => ({ ...o, note: note.trim() || undefined }))
}

export async function resendConfirmation(id: string) {
  const o = await getOrder(id)
  if (!o || o.status === 'pending' || o.status === 'failed' || o.status === 'cancelled') return false
  const { sendOrderEmails } = await import('./email')
  return sendOrderEmails(o, { notifyOwner: false })
}

/** The house corrects a guest's details (address change, typo in a name, gift message). */
export async function editOrderDetails(id: string, patch: { customer: Order['customer']; gift?: string }) {
  return (await getStore()).updateOrder(id, (o) => {
    const before = JSON.stringify([o.customer, o.gift?.message ?? ''])
    o.customer = { ...patch.customer, email: patch.customer.email.trim().toLowerCase() }
    o.gift = patch.gift?.trim() ? { message: patch.gift.trim() } : undefined
    if (JSON.stringify([o.customer, o.gift?.message ?? '']) === before) return null
    return stamp(o, 'details-edited')
  })
}

/** Payment received outside the site (UPI to the house, cash, bank transfer). */
export async function markPaidManually(id: string, method: string, email: boolean) {
  return markPaid(id, { method }, { email, note: `received by ${method}` })
}

export type ManualOrderInput = {
  lines: { variantId: string; qty: number }[]
  customer: Order['customer']
  gift?: string
  method: string
  note?: string
  email: boolean
}

/**
 * A reservation taken by the concierge (phone, WhatsApp, an event). Counts against the edition
 * like any other, and is refused if the edition can no longer fill it.
 */
export async function createManualOrder(input: ManualOrderInput) {
  const { priceLines } = await import('./pricing')
  const { stockFrom } = await import('./stock')
  const { getInventory } = await import('./inventory')
  const totals = priceLines(input.lines, 'full', 50)
  if (!totals.lines.length) throw new OrderActionError('Choose at least one fragrance')
  const inventory = await getInventory()
  const created = await createOrder<string>(
    {
      plan: totals.plan,
      totals,
      customer: { ...input.customer, email: input.customer.email.trim().toLowerCase() },
      gift: input.gift?.trim() ? { message: input.gift.trim() } : undefined,
      payment: { provider: 'manual', method: input.method },
      note: input.note?.trim() || undefined,
    },
    (reserved) => {
      const stock = stockFrom(reserved, inventory)
      for (const l of totals.lines) {
        if (l.qty > (stock[l.variantId]?.edition ?? 0) - (stock[l.variantId]?.reserved ?? 0)) {
          return `Not enough ${l.name} left in the edition`
        }
      }
      return null
    },
  )
  if (!created.ok) throw new OrderActionError(created.fail)
  return markPaid(created.order.id, { method: input.method }, { email: input.email, note: `taken by the concierge · ${input.method}` })
}
