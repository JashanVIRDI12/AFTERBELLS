import 'server-only'
import type { Order } from './orders'
import { formatINR } from './pricing'
import { site, whatsappLink, isFastPin } from './site'
import { compliments } from './content'

/**
 * Transactional email through Resend (https://resend.com) — optional.
 * Set RESEND_API_KEY and EMAIL_FROM (e.g. "After Bells <concierge@afterbells.com>").
 * ORDER_NOTIFY_EMAIL receives a copy of every paid order.
 * Every sender here returns true/false and never throws: an email must never break an order.
 */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

async function send(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  })
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
}

async function safely(fn: () => Promise<void>) {
  if (!emailEnabled()) return false
  try {
    await fn()
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const first = (o: Order) => esc(o.customer.name.split(' ')[0])
const orderUrl = (o: Order) => `${site.url}/order/${o.id}`

/** The house letterhead: ivory card, gold rule, the wordmark and the line. */
function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6eee4;font-family:Poppins,Helvetica,Arial,sans-serif;color:#271d0c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf7f1;border:1.5px solid #c9a352">
<tr><td style="padding:40px 36px;text-align:center">
<p style="margin:0;font-size:22px;letter-spacing:.32em;color:#ac8028">AFTER BELLS</p>
<p style="margin:6px 0 28px;font-size:9px;letter-spacing:.34em;color:#6a5c48">RESERVED FOR THE EXCEPTIONAL</p>
<p style="margin:0;font-family:Georgia,serif;font-size:34px;color:#ac8028">${title}</p>
${body}
<p style="margin:32px 0 0;font-size:12px;color:#6a5c48">Questions? Call or <a href="${whatsappLink('Hello After Bells, I have a question about my order.')}" style="color:#ac8028;text-decoration:none">WhatsApp</a> our concierge on ${site.concierge.map((c) => `<a href="tel:${c.tel}" style="color:#ac8028;text-decoration:none">${c.display}</a>`).join(' or ')}.</p>
</td></tr></table></td></tr></table></body></html>`
}

const button = (href: string, label: string) =>
  `<p style="margin:26px 0 0"><a href="${href}" style="display:inline-block;padding:14px 28px;background:#c9a352;color:#271d0c;text-decoration:none;font-size:11px;letter-spacing:.24em;text-transform:uppercase">${label}</a></p>`

function itemsTable(o: Order, label: string) {
  const rows = o.totals.lines
    .map(
      (l) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eadfcd;letter-spacing:.18em;text-transform:uppercase;font-size:12px;text-align:left">${esc(l.name)}${l.size ? ` · ${esc(l.size)}` : ''} × ${l.qty}</td><td style="padding:10px 0;border-bottom:1px solid #eadfcd;text-align:right;font-size:13px">${formatINR(l.total)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td style="padding:14px 0 0;font-size:13px;text-align:left">${label}</td><td style="padding:14px 0 0;text-align:right;font-size:15px">${formatINR(o.totals.dueNow)}</td></tr></table>`
}

function confirmationHtml(o: Order) {
  return layout(
    'Thank You',
    `<p style="margin:14px 0 28px;font-size:14px;line-height:1.7">${first(o)}, your order <b>${o.number}</b> from the ${site.edition.name} is confirmed. ${isFastPin(o.customer.pin) ? `${site.delivery.fastShort}, in ${site.delivery.fastPlace}.` : `${site.delivery.standardShort}.`} We will send tracking the day it leaves the house.</p>
${itemsTable(o, 'Paid')}
<p style="margin:28px 0 0;font-size:12px;line-height:1.7;color:#6a5c48">Delivering to ${esc(o.customer.address1)}, ${esc(o.customer.city)}, ${esc(o.customer.state)} ${esc(o.customer.pin)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border:1px solid #e3cf9f">
<tr><td style="padding:18px 20px;text-align:center">
<p style="margin:0 0 10px;font-size:9px;letter-spacing:.3em;color:#ac8028">WITH OUR COMPLIMENTS</p>
<p style="margin:0;font-size:13px;line-height:1.8">${compliments.map((c) => esc(c.title)).join(' · ')}</p>
</td></tr></table>
${button(orderUrl(o), 'View your order')}
<p style="margin:28px 0 0;font-size:12px;color:#6a5c48">Share your moment — tag us on Instagram @${site.instagram}</p>`,
  )
}

/** Guest confirmation + owner notification. */
export async function sendOrderEmails(o: Order, opts: { notifyOwner?: boolean } = {}) {
  return safely(async () => {
    await send(o.customer.email, `Your After Bells order ${o.number}`, confirmationHtml(o))
    const owner = process.env.ORDER_NOTIFY_EMAIL
    if (owner && opts.notifyOwner !== false) {
      const summary = o.totals.lines.map((l) => `${l.name} × ${l.qty}`).join(', ')
      await send(
        owner,
        `New order ${o.number} · ${formatINR(o.totals.dueNow)}`,
        `<p><b>${o.number}</b> — ${esc(summary)}</p><p>${esc(o.customer.name)} · ${esc(o.customer.email)} · +91 ${esc(o.customer.phone)}</p><p>${esc(o.customer.address1)} ${esc(o.customer.address2 ?? '')}, ${esc(o.customer.city)}, ${esc(o.customer.state)} ${esc(o.customer.pin)}</p>${o.gift ? `<p>Gift message: “${esc(o.gift.message)}”</p>` : ''}`,
      )
    }
  })
}

/** "Your After Bells is on its way" — courier and tracking. */
export async function sendDispatchEmail(o: Order) {
  const f = o.fulfilment ?? {}
  return safely(() =>
    send(
      o.customer.email,
      `Your After Bells is on its way · ${o.number}`,
      layout(
        'On its way',
        `<p style="margin:14px 0 24px;font-size:14px;line-height:1.7">${first(o)}, your order <b>${o.number}</b> has left the house, sealed in gold.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;border-bottom:1px solid #eadfcd;font-size:11px;letter-spacing:.2em;text-transform:uppercase;text-align:left;color:#6a5c48">Courier</td><td style="padding:10px 0;border-bottom:1px solid #eadfcd;text-align:right;font-size:13px">${esc(f.courier ?? '')}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #eadfcd;font-size:11px;letter-spacing:.2em;text-transform:uppercase;text-align:left;color:#6a5c48">Tracking</td><td style="padding:10px 0;border-bottom:1px solid #eadfcd;text-align:right;font-size:13px">${esc(f.tracking ?? '')}</td></tr>
</table>
${button(f.trackingUrl || orderUrl(o), f.trackingUrl ? 'Track your parcel' : 'View your order')}`,
      ),
    ),
  )
}

/** Sent when the house cancels a paid order (with or without a refund). */
export async function sendCancellationEmail(o: Order) {
  const refunded = !o.refund
    ? 'If a payment was taken, our concierge will be in touch about your refund.'
    : o.refund.status === 'manual'
      ? `Our concierge will arrange your refund of <b>${formatINR(o.refund.amount)}</b> and write to you when it is sent.`
      : `A refund of <b>${formatINR(o.refund.amount)}</b> has been issued to your original payment method. Banks usually take 5–7 working days to show it.`
  return safely(() =>
    send(
      o.customer.email,
      `Your After Bells order ${o.number} has been cancelled`,
      layout(
        'Cancelled',
        `<p style="margin:14px 0 20px;font-size:14px;line-height:1.7">${first(o)}, your order <b>${o.number}</b> has been cancelled.</p>
<p style="margin:0;font-size:13px;line-height:1.7;color:#6a5c48">${refunded}</p>`,
      ),
    ),
  )
}

/** The six-digit code that signs a client in to their account. */
export async function sendLoginCode(email: string, code: string) {
  return safely(() =>
    send(
      email,
      `${code} is your After Bells sign-in code`,
      layout(
        'Your code',
        `<p style="margin:14px 0 24px;font-size:14px;line-height:1.7">Enter this code to sign in to your After Bells account. It expires in ten minutes.</p>
<p style="margin:0;font-size:34px;letter-spacing:.42em;color:#271d0c">${esc(code)}</p>
<p style="margin:26px 0 0;font-size:12px;line-height:1.7;color:#6a5c48">If you did not ask for this code, you can ignore this email. Your account stays closed without it.</p>`,
      ),
    ),
  )
}
