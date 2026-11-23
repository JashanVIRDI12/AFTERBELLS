import type { Lead, Order, Store } from '@/lib/db'
import { RESERVING } from '@/lib/db'
import { fragrances, getVariant } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import { site } from '@/lib/site'
import { leadStatusAction, removeLeadAction } from '../actions'
import { Back, fmtDate } from './shared'
import styles from '../Admin.module.css'

const KIND: Record<Lead['kind'], string> = {
  checkout: 'Left checkout',
  finder: 'Finder match',
  notify: 'Notify me',
  salon: 'Letters on WhatsApp',
  waitlist: 'Waitlist',
}
const HOUR: Record<string, string> = { 'amber-hour': 'Amber Hour', 'open-sky': 'Open Sky', 'iron-crown': 'Iron Crown', undecided: 'Not sure yet' }
const interestsOf = (l: Lead) => (l.interests ?? []).map((i) => HOUR[i] ?? i).join(', ')

const VIEWS = [
  { key: 'open', label: 'To follow up' },
  { key: 'waitlist', label: 'Waitlist' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'ordered', label: 'Ordered' },
  { key: 'all', label: 'All' },
] as const

const bag = (l: Lead) => (l.lines ?? []).map((x) => `${getVariant(x.variantId)?.product.name ?? x.variantId}${x.qty > 1 ? ` × ${x.qty}` : ''}`).join(', ')
const aboutName = (l: Lead) => (l.about ? (getVariant(l.about)?.product.name ?? fragrances.find((f) => f.slug === l.about)?.name ?? l.about) : '')

/** A first message the concierge can send as it is, or edit. */
function followUp(l: Lead) {
  const hi = `Hello${l.name ? ` ${l.name.split(' ')[0]}` : ''}, this is the After Bells concierge.`
  const f = fragrances.find((x) => x.slug === l.about) ?? (l.about ? fragrances.find((x) => getVariant(l.about!)?.product.slug.startsWith(x.slug)) : undefined)
  const url = f ? ` ${site.url}/fragrances/${f.slug}` : ''
  switch (l.kind) {
    case 'checkout':
      return `${hi} I saw you were choosing ${bag(l) || 'a fragrance'} on our website. May I help you complete your order? I can take it here on WhatsApp if that is easier.`
    case 'finder':
      return `${hi} Your hour is ${aboutName(l)}. ${f?.tagline ?? ''} It is ${formatINR(f?.variants[0].price ?? 0)} for 60 ml, with three 2 ml vials of the other hours and complimentary delivery. Shall I set one aside for you?${url}`
    case 'notify':
      return `${hi} You asked to hear about ${aboutName(l)}. It is available again. Shall I set one aside for you?${url}`
    case 'salon':
      return `${hi} Thank you for joining the house letters. We will write rarely: new hours and invitations only. Reply STOP at any time.`
    case 'waitlist':
      return `${hi} Thank you for joining the waitlist. The First Edition is opening, and you are among the first to know. ${site.url}`
  }
  return hi
}

/** a paid order from the same person after the lead was taken */
function orderFor(l: Lead, orders: Order[]) {
  return orders.find(
    (o) =>
      RESERVING.includes(o.status) &&
      o.createdAt >= l.createdAt.slice(0, 10) &&
      ((l.email && o.customer.email.toLowerCase() === l.email) || (l.phone && o.customer.phone.replace(/\D/g, '').endsWith(l.phone))),
  )
}

export default async function Leads({ store, view }: { store: Store; view: string }) {
  const [leads, orders] = await Promise.all([store.listLeads(), store.listOrders()])
  const rows = leads.map((l) => ({ l, order: orderFor(l, orders) }))
  // the waitlist is its own list: it is not "to follow up" until the house opens
  const follow = rows.filter((r) => r.l.kind !== 'waitlist')
  const counts = {
    open: follow.filter((r) => !r.order && r.l.status === 'open').length,
    waitlist: rows.filter((r) => r.l.kind === 'waitlist').length,
    contacted: rows.filter((r) => !r.order && r.l.status === 'contacted').length,
    ordered: rows.filter((r) => r.order).length,
    all: rows.length,
  }
  const v = VIEWS.find((x) => x.key === view)?.key ?? 'open'
  const shown =
    v === 'waitlist'
      ? rows.filter((r) => r.l.kind === 'waitlist')
      : v === 'all'
        ? rows
        : (v === 'ordered' ? rows : follow).filter((r) => (v === 'ordered' ? r.order : !r.order && r.l.status === v))
  const waiting = rows.filter((r) => !r.order && r.l.status === 'open' && r.l.kind === 'checkout').reduce((n, r) => n + (r.l.total ?? 0), 0)

  return (
    <>
      <div className={styles.kpis}>
        <div>
          <span>To follow up</span>
          <b>{counts.open}</b>
        </div>
        <div>
          <span>Waitlist</span>
          <b>{counts.waitlist}</b>
        </div>
        <div>
          <span>Left in checkout bags</span>
          <b>{formatINR(waiting)}</b>
        </div>
        <div>
          <span>Became orders</span>
          <b>{counts.ordered}</b>
        </div>
      </div>
      <p className={styles.hint}>
        People who left a number or email without ordering: at checkout, in the finder, asking to hear about a fully reserved fragrance, or
        on the waitlist. The WhatsApp link opens with a first message ready.{' '}
        <a href="/api/admin/export?type=waitlist">Waitlist for Excel (CSV)</a> · <a href="/api/admin/export?type=leads">All leads (CSV)</a>
      </p>
      <nav className={styles.tabs} aria-label="Leads">
        {VIEWS.map((x) => (
          <a key={x.key} href={`/admin?tab=leads&view=${x.key}`} className={x.key === v ? styles.tabOn : ''} aria-current={x.key === v ? 'page' : undefined}>
            {x.label} <small>{counts[x.key]}</small>
          </a>
        ))}
      </nav>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>What</th>
              <th>Who</th>
              <th>About</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map(({ l, order }) => (
              <tr key={l.id}>
                <td>{fmtDate(l.updatedAt)}</td>
                <td>
                  {KIND[l.kind]}
                  {l.origin?.source ? <small className={styles.items}> · {l.origin.source}</small> : null}
                </td>
                <td className={styles.who}>
                  {l.name || '—'}
                  {l.phone && (
                    <small>
                      <a href={`https://wa.me/91${l.phone}?text=${encodeURIComponent(followUp(l))}`} target="_blank" rel="noopener noreferrer">
                        WhatsApp +91 {l.phone}
                      </a>
                    </small>
                  )}
                  {l.email && (
                    <small>
                      <a href={`mailto:${l.email}`}>{l.email}</a>
                    </small>
                  )}
                  {l.city || l.pin ? <small>{[l.city, l.pin].filter(Boolean).join(' · ')}</small> : null}
                </td>
                <td>
                  {l.kind === 'checkout' ? (
                    <>
                      {bag(l) || '—'}
                      {l.total ? <small className={styles.items}> · {formatINR(l.total)}</small> : null}
                    </>
                  ) : (
                    (l.kind === 'waitlist' ? interestsOf(l) : aboutName(l)) || '—'
                  )}
                  {order && (
                    <small className={styles.items}>
                      {' '}
                      · ordered <a href={`/admin?tab=orders&view=all&q=${encodeURIComponent(order.number)}`}>{order.number}</a>
                    </small>
                  )}
                </td>
                <td>
                  {!order && (
                    <form action={leadStatusAction}>
                      <Back q={`tab=leads&view=${v}`} />
                      <input type="hidden" name="leadId" value={l.id} />
                      <input type="hidden" name="status" value={l.status === 'open' ? 'contacted' : 'open'} />
                      <button className={styles.textBtn}>{l.status === 'open' ? 'Mark contacted' : 'Reopen'}</button>
                    </form>
                  )}
                  <form action={removeLeadAction}>
                    <Back q={`tab=leads&view=${v}`} />
                    <input type="hidden" name="leadId" value={l.id} />
                    <button className={styles.textBtn}>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={5}>Nothing here yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
