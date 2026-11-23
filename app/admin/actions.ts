'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { checkAdmin } from '@/lib/admin-auth'
import { emailEnabled } from '@/lib/email'
import { customerSchema } from '@/lib/checkout-schema'
import { products, getVariant } from '@/lib/catalog'
import { getStore } from '@/lib/db'
import { updateInventory } from '@/lib/inventory'
import {
  cancelOrder,
  createManualOrder,
  editOrderDetails,
  markDelivered,
  markDispatched,
  markPaidManually,
  resendConfirmation,
  setNote,
} from '@/lib/orders'

/** Every action re-checks the admin password: never trust that the page itself was protected. */
async function guard() {
  if (!checkAdmin((await headers()).get('authorization'))) throw new Error('Not authorised')
}

/** Return to the same admin view, with a message. `back` carries the view's query string. */
function back(fd: FormData, msg: string, tone: 'ok' | 'err' = 'ok'): never {
  revalidatePath('/admin')
  const q = new URLSearchParams(String(fd.get('back') ?? 'tab=orders'))
  q.delete('ok')
  q.delete('err')
  q.set(tone, msg)
  const anchor = fd.get('orderId') ? `#${String(fd.get('orderId'))}` : ''
  redirect(`/admin?${q.toString()}${anchor}`)
}

const id = z.string().min(8).max(64)
const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? 'Please check the form'

/* ---------------- orders ---------------- */

export async function dispatchAction(fd: FormData) {
  await guard()
  const parsed = z
    .object({
      orderId: id,
      courier: z.string().trim().min(2, 'Choose the courier').max(40),
      tracking: z.string().trim().min(3, 'Enter the tracking number').max(60),
      trackingUrl: z.union([z.literal(''), z.url('The tracking link must be a full https:// address').max(300)]),
      notify: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd))
  if (!parsed.success) back(fd, firstIssue(parsed.error), 'err')
  const d = parsed.data
  const o = await markDispatched(d.orderId, { courier: d.courier, tracking: d.tracking, trackingUrl: d.trackingUrl }, d.notify === 'on')
  if (!o || o.status !== 'dispatched') back(fd, 'Only paid orders can be dispatched', 'err')
  const told = d.notify === 'on' && emailEnabled()
  back(fd, `${o.number} dispatched${told ? ' — the guest has been emailed' : d.notify === 'on' ? ' — email is off, so tell the guest yourself' : ''}`)
}

export async function deliveredAction(fd: FormData) {
  await guard()
  const o = await markDelivered(id.parse(fd.get('orderId')))
  if (!o || o.status !== 'delivered') back(fd, 'Only dispatched orders can be marked delivered', 'err')
  back(fd, `${o.number} marked delivered`)
}

export async function cancelAction(fd: FormData) {
  await guard()
  const parsed = z
    .object({
      orderId: id,
      refund: z.string().optional(),
      reason: z.string().trim().max(300).optional().default(''),
      confirm: z.literal('on', { message: 'Tick the box to confirm the cancellation' }),
    })
    .safeParse(Object.fromEntries(fd))
  if (!parsed.success) back(fd, firstIssue(parsed.error), 'err')
  let msg = ''
  let failed = false
  try {
    const o = await cancelOrder(parsed.data.orderId, { refund: parsed.data.refund === 'on', reason: parsed.data.reason || undefined })
    msg = o?.refund
      ? `${o.number} cancelled · refund of ₹${o.refund.amount.toLocaleString('en-IN')} ${o.refund.status === 'manual' ? 'to be made by hand' : 'issued'}`
      : `${o?.number ?? 'Order'} cancelled`
  } catch (e) {
    failed = true
    msg = e instanceof Error ? e.message : 'Could not cancel'
  }
  back(fd, msg, failed ? 'err' : 'ok')
}

export async function noteAction(fd: FormData) {
  await guard()
  await setNote(id.parse(fd.get('orderId')), String(fd.get('note') ?? '').slice(0, 1000))
  back(fd, 'Note saved')
}

export async function resendAction(fd: FormData) {
  await guard()
  const ok = await resendConfirmation(id.parse(fd.get('orderId')))
  back(fd, ok ? 'Confirmation sent again' : 'Email is not configured, or this order cannot be confirmed', ok ? 'ok' : 'err')
}

/** Correct a guest's name, contact, address or gift message. */
export async function editOrderAction(fd: FormData) {
  await guard()
  const orderId = id.parse(fd.get('orderId'))
  const parsed = customerSchema.safeParse({
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    address1: fd.get('address1'),
    address2: fd.get('address2') ?? '',
    city: fd.get('city'),
    state: fd.get('state'),
    pin: fd.get('pin'),
  })
  if (!parsed.success) back(fd, firstIssue(parsed.error), 'err')
  const o = await editOrderDetails(orderId, { customer: parsed.data, gift: String(fd.get('gift') ?? '').slice(0, 240) })
  back(fd, o ? `${o.number} updated` : 'Order not found', o ? 'ok' : 'err')
}

/** Money received outside the site — UPI to the house, cash, bank transfer. */
export async function markPaidAction(fd: FormData) {
  await guard()
  const parsed = z
    .object({ orderId: id, method: z.string().trim().min(2).max(40), email: z.string().optional() })
    .safeParse(Object.fromEntries(fd))
  if (!parsed.success) back(fd, 'Choose how the payment was received', 'err')
  const o = await markPaidManually(parsed.data.orderId, parsed.data.method, parsed.data.email === 'on')
  if (!o || o.status !== 'paid') back(fd, 'Only unpaid orders can be marked paid', 'err')
  back(fd, `${o.number} marked paid (${parsed.data.method})`)
}

/** A reservation taken by the concierge: phone, WhatsApp, an event. */
export async function manualOrderAction(fd: FormData) {
  await guard()
  const lines = products
    .flatMap((f) => f.variants.map((v) => ({ variantId: v.id, qty: Number(fd.get(`qty-${v.id}`) ?? 0) })))
    .filter((l) => Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 50)
  if (!lines.length) back(fd, 'Enter a quantity for at least one fragrance', 'err')
  const customer = customerSchema.safeParse({
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    address1: fd.get('address1'),
    address2: fd.get('address2') ?? '',
    city: fd.get('city'),
    state: fd.get('state'),
    pin: fd.get('pin'),
  })
  if (!customer.success) back(fd, firstIssue(customer.error), 'err')
  const method = String(fd.get('method') ?? '').trim()
  if (method.length < 2) back(fd, 'Choose how the payment was received', 'err')
  let msg = ''
  let failed = false
  let orderId = ''
  try {
    const o = await createManualOrder({
      lines,
      customer: customer.data,
      gift: String(fd.get('gift') ?? '').slice(0, 240),
      method,
      note: String(fd.get('note') ?? '').slice(0, 1000),
      email: fd.get('email-guest') === 'on',
    })
    orderId = o?.id ?? ''
    msg = o ? `${o.number} created and marked paid` : 'Order created'
  } catch (e) {
    failed = true
    msg = e instanceof Error ? e.message : 'Could not create the order'
  }
  if (!failed && orderId) fd.set('orderId', orderId)
  fd.set('back', 'tab=orders&view=open')
  back(fd, msg, failed ? 'err' : 'ok')
}

/* ---------------- inventory ---------------- */

export async function inventoryAction(fd: FormData) {
  await guard()
  const parsed = z
    .object({
      variantId: z.string().refine((value) => Boolean(getVariant(value)), 'Unknown product'),
      editionSize: z.coerce.number().int().min(0, 'The edition cannot be negative').max(100000),
      offline: z.coerce.number().int().min(0, 'Offline sales cannot be negative').max(100000),
      paused: z.string().optional(),
      note: z.string().trim().max(200).optional().default(''),
    })
    .safeParse(Object.fromEntries(fd))
  if (!parsed.success) back(fd, firstIssue(parsed.error), 'err')
  const d = parsed.data
  const { getStock } = await import('@/lib/stock')
  const online = (await getStock())[d.variantId]?.online ?? 0
  if (d.editionSize < online + d.offline) {
    back(fd, `The edition cannot be smaller than the ${online + d.offline} bottles already reserved`, 'err')
  }
  await updateInventory(d.variantId, { editionSize: d.editionSize, offline: d.offline, paused: d.paused === 'on' }, d.note || undefined)
  const found = getVariant(d.variantId)
  const name = found ? `${found.product.name} ${found.variant.size}` : d.variantId
  back(fd, `${name} inventory saved`)
}

/* ---------------- Salon & feedback ---------------- */

export async function addSubscriberAction(fd: FormData) {
  await guard()
  const email = z.email('Enter a valid email address').max(120).safeParse(String(fd.get('email') ?? '').trim().toLowerCase())
  if (!email.success) back(fd, firstIssue(email.error), 'err')
  const added = await (await getStore()).addSubscriber(email.data, 'admin')
  back(fd, added ? `${email.data} added to the Salon` : `${email.data} is already a member`)
}

export async function removeSubscriberAction(fd: FormData) {
  await guard()
  const email = String(fd.get('email') ?? '')
  const removed = await (await getStore()).removeSubscriber(email)
  back(fd, removed ? `${email} removed` : 'Not found', removed ? 'ok' : 'err')
}

export async function removeFeedbackAction(fd: FormData) {
  await guard()
  const removed = await (await getStore()).removeFeedback(String(fd.get('feedbackId') ?? ''))
  back(fd, removed ? 'Feedback removed' : 'Not found', removed ? 'ok' : 'err')
}

export async function publishFeedbackAction(fd: FormData) {
  await guard()
  const on = fd.get('on') === '1'
  const ok = await (await getStore()).publishFeedback(String(fd.get('feedbackId') ?? ''), on)
  if (ok) {
    revalidatePath('/')
    revalidatePath('/fragrances/[slug]', 'page')
  }
  back(fd, ok ? (on ? 'Shown on the site' : 'Taken off the site') : 'Only feedback the client agreed to share can be shown', ok ? 'ok' : 'err')
}

/* ---------------- leads ---------------- */

export async function leadStatusAction(fd: FormData) {
  await guard()
  const status = z.enum(['open', 'contacted', 'closed']).safeParse(fd.get('status'))
  if (!status.success) back(fd, 'Unknown status', 'err')
  const ok = await (await getStore()).setLeadStatus(String(fd.get('leadId') ?? ''), status.data)
  back(fd, ok ? (status.data === 'contacted' ? 'Marked as contacted' : 'Reopened') : 'Not found', ok ? 'ok' : 'err')
}

export async function removeLeadAction(fd: FormData) {
  await guard()
  const ok = await (await getStore()).removeLead(String(fd.get('leadId') ?? ''))
  back(fd, ok ? 'Lead removed' : 'Not found', ok ? 'ok' : 'err')
}
