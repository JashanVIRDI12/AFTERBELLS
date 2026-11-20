import { checkAdmin } from '@/lib/admin-auth'
import { getStore } from '@/lib/db'
import { customersFrom } from '@/lib/customers'

export const dynamic = 'force-dynamic'

const cell = (v: unknown) => {
  const s = String(v ?? '')
  // neutralise spreadsheet formula injection and quote
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}
const csv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(',')).join('\n')

export async function GET(req: Request) {
  if (!checkAdmin(req.headers.get('authorization'))) return new Response('Not found', { status: 404 })
  const store = await getStore()
  const type = new URL(req.url).searchParams.get('type')
  let body = ''
  if (type === 'orders') {
    const orders = await store.listOrders()
    body = csv([
      ['number', 'date', 'status', 'name', 'email', 'phone', 'items', 'amount', 'address', 'city', 'state', 'pin', 'gift', 'courier', 'tracking', 'dispatched', 'delivered', 'refund', 'razorpay_payment', 'note'],
      ...orders.map((o) => [
        o.number,
        o.createdAt,
        o.status,
        o.customer.name,
        o.customer.email,
        o.customer.phone,
        o.totals.lines.map((l) => `${l.name} x${l.qty}`).join('; '),
        o.totals.dueNow,
        [o.customer.address1, o.customer.address2].filter(Boolean).join(', '),
        o.customer.city,
        o.customer.state,
        o.customer.pin,
        o.gift?.message ?? '',
        o.fulfilment?.courier ?? '',
        o.fulfilment?.tracking ?? '',
        o.fulfilment?.dispatchedAt ?? '',
        o.fulfilment?.deliveredAt ?? '',
        o.refund ? `${o.refund.amount} (${o.refund.status})` : '',
        o.payment.razorpayPaymentId ?? '',
        o.note ?? '',
      ]),
    ])
  } else if (type === 'customers') {
    const [orders, subs] = await Promise.all([store.listOrders(), store.listSubscribers()])
    const rows = customersFrom(orders, new Set(subs.map((s) => s.email)))
    body = csv([
      ['name', 'email', 'phone', 'city', 'state', 'orders', 'bottles', 'spent', 'favourite', 'first order', 'last order', 'salon'],
      ...rows.map((c) => [c.name, c.email, c.phone, c.city, c.state, c.orders, c.bottles, c.spent, c.favourite, c.first, c.last, c.salon ? 'yes' : 'no']),
    ])
  } else if (type === 'subscribers') {
    const subs = await store.listSubscribers()
    body = csv([['email', 'joined', 'source'], ...subs.map((s) => [s.email, s.at, s.source ?? ''])])
  } else if (type === 'feedback') {
    const fb = await store.listFeedback()
    body = csv([
      ['date', 'fragrance', 'scent', 'longevity', 'packaging', 'comments', 'name', 'order', 'may quote'],
      ...fb.map((f) => [f.at, f.fragrance.join('; '), f.scent, f.longevity, f.packaging, f.comments, f.name, f.orderNumber, f.consent ? 'yes' : 'no']),
    ])
  } else {
    return new Response('Unknown export', { status: 400 })
  }
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="afterbells-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
