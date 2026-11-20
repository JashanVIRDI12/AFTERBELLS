import type { Store } from '@/lib/db'
import { products } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import { site } from '@/lib/site'
import { getInventory } from '@/lib/inventory'
import { stockFrom } from '@/lib/stock'
import { LABEL, fmtDate } from './shared'
import styles from '../Admin.module.css'

export default async function Overview({ store }: { store: Store }) {
  const since7 = new Date(Date.now() - 7 * 864e5)
  const [orders, subscribers, feedback, reserved, inventory, stats] = await Promise.all([
    store.listOrders(),
    store.listSubscribers(),
    store.listFeedback(),
    store.reservedByVariant(),
    getInventory(),
    store.eventStats(since7),
  ])
  const stock = stockFrom(reserved, inventory)
  const taken = orders.filter((o) => o.status === 'paid' || o.status === 'dispatched' || o.status === 'delivered')
  const collected = taken.reduce((s, o) => s + o.totals.dueNow, 0)
  const refunded = orders.reduce((s, o) => s + (o.refund?.amount ?? 0), 0)
  const bottles = taken.reduce((s, o) => s + o.totals.count, 0)
  const toDispatch = orders.filter((o) => o.status === 'paid')
  const leads = orders.filter((o) => (o.status === 'pending' || o.status === 'failed') && Date.now() - new Date(o.createdAt).getTime() > 30 * 60_000)
  const avg = (k: 'scent' | 'longevity' | 'packaging') =>
    feedback.length ? (feedback.reduce((s, f) => s + f[k], 0) / feedback.length).toFixed(1) : '—'
  const alerts = products.flatMap((f) => {
    const s = stock[f.variants[0].id]
    const left = s.edition - s.reserved
    if (s.paused) return [`${f.name} is paused — online reservations are off`]
    if (left <= 0) return [`${f.name} is fully reserved`]
    if (left / s.edition <= site.edition.lowStockShare) return [`${f.name}: only ${left} bottles left`]
    return []
  })

  return (
    <>
      <div className={styles.kpis}>
        <div>
          <span>To dispatch</span>
          <b>{toDispatch.length}</b>
        </div>
        <div>
          <span>Reservations · bottles</span>
          <b>
            {taken.length} <small>· {bottles}</small>
          </b>
        </div>
        <div>
          <span>Collected{refunded ? ' · refunded' : ''}</span>
          <b>
            {formatINR(collected)}
            {refunded ? <small> · {formatINR(refunded)}</small> : null}
          </b>
        </div>
        <div>
          <span>Visitors · 7 days</span>
          <b>{stats.visitors}</b>
        </div>
        <div>
          <span>Salon members</span>
          <b>{subscribers.length}</b>
        </div>
        <div>
          <span>Feedback · scent / longevity / packaging</span>
          <b>
            {avg('scent')} / {avg('longevity')} / {avg('packaging')}
          </b>
        </div>
      </div>

      {(alerts.length > 0 || toDispatch.length > 0 || leads.length > 0) && (
        <ul className={styles.attention}>
          {toDispatch.length > 0 && (
            <li>
              <a href="/admin?tab=orders&view=open">
                {toDispatch.length} reservation{toDispatch.length === 1 ? '' : 's'} waiting to be dispatched →
              </a>
            </li>
          )}
          {leads.length > 0 && (
            <li>
              <a href="/admin?tab=customers#leads">
                {leads.length} unfinished checkout{leads.length === 1 ? '' : 's'} to follow up →
              </a>
            </li>
          )}
          {alerts.map((a) => (
            <li key={a}>
              <a href="/admin?tab=inventory">{a} →</a>
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.h2}>Edition stock</h2>
      <div className={styles.stock}>
        {products.map((f) => {
          const s = stock[f.variants[0].id]
          return (
            <a key={f.slug} href="/admin?tab=inventory">
              <span className="t-name">{f.name} · {f.variants[0].size}</span>
              <b>
                {s.edition - s.reserved} <small>of {s.edition} remaining{s.paused ? ' · paused' : ''}</small>
              </b>
              <i style={{ transform: `scaleX(${s.edition ? s.reserved / s.edition : 0})` }} />
            </a>
          )
        })}
      </div>

      <h2 className={styles.h2}>Latest reservations</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No.</th>
              <th>Date</th>
              <th>Guest</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...orders]
              .reverse()
              .slice(0, 8)
              .map((o) => (
                <tr key={o.id}>
                  <td>
                    <a href={`/admin?tab=orders&view=all&q=${encodeURIComponent(o.number)}`}>{o.number}</a>
                  </td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>{o.customer.name}</td>
                  <td>{o.totals.lines.map((l) => `${l.name} × ${l.qty}`).join(', ')}</td>
                  <td>{formatINR(o.totals.dueNow)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[o.status]}`}>{LABEL[o.status]}</span>
                  </td>
                </tr>
              ))}
            {!orders.length && (
              <tr>
                <td colSpan={6}>No reservations yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.exports}>
        <a href="/api/admin/export?type=orders">Export orders (CSV)</a>
        <a href="/api/admin/export?type=customers">Export customers (CSV)</a>
        <a href="/api/admin/export?type=subscribers">Export Salon (CSV)</a>
        <a href="/api/admin/export?type=feedback">Export feedback (CSV)</a>
      </div>
    </>
  )
}
