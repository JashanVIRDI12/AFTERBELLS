import type { Store } from '@/lib/db'
import { formatINR } from '@/lib/pricing'
import { customersFrom, leadsFrom } from '@/lib/customers'
import { fmtDate, fmtDay } from './shared'
import styles from '../Admin.module.css'

export default async function Customers({ store }: { store: Store }) {
  const [orders, subs] = await Promise.all([store.listOrders(), store.listSubscribers()])
  const customers = customersFrom(orders, new Set(subs.map((s) => s.email)))
  const leads = leadsFrom(orders)

  return (
    <>
      <div className={styles.kpis}>
        <div>
          <span>Customers</span>
          <b>{customers.length}</b>
        </div>
        <div>
          <span>Returning</span>
          <b>{customers.filter((c) => c.orders > 1).length}</b>
        </div>
        <div>
          <span>Average order</span>
          <b>{customers.length ? formatINR(customers.reduce((s, c) => s + c.spent, 0) / customers.reduce((s, c) => s + c.orders, 0)) : '—'}</b>
        </div>
        <div>
          <span>Leads to follow up</span>
          <b>{leads.length}</b>
        </div>
      </div>

      <h2 className={styles.h2}>Customers</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>City</th>
              <th>Orders</th>
              <th>Bottles</th>
              <th>Spent</th>
              <th>Favourite</th>
              <th>Since</th>
              <th>Salon</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email}>
                <td>
                  <a href={`/admin?tab=orders&view=all&q=${encodeURIComponent(c.email)}`}>{c.name}</a>
                </td>
                <td>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                  <br />
                  <small>
                    <a href={`tel:+91${c.phone}`}>+91 {c.phone}</a> ·{' '}
                    <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </small>
                </td>
                <td>
                  {c.city}
                  <br />
                  <small>{c.state}</small>
                </td>
                <td>{c.orders}</td>
                <td>{c.bottles}</td>
                <td>{formatINR(c.spent)}</td>
                <td>{c.favourite}</td>
                <td>{fmtDay(c.first)}</td>
                <td>{c.salon ? 'Yes' : '—'}</td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={9}>No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.h2} id="leads">
        Unfinished checkouts
      </h2>
      <p className={styles.hint}>Guests who entered their details but never completed payment. A gentle call from the concierge often helps.</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Wanted</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((o) => (
              <tr key={o.id}>
                <td>{fmtDate(o.createdAt)}</td>
                <td>
                  <a href={`/admin?tab=orders&view=unpaid&q=${encodeURIComponent(o.number)}`}>{o.customer.name}</a>
                </td>
                <td>
                  <a href={`tel:+91${o.customer.phone}`}>+91 {o.customer.phone}</a> ·{' '}
                  <a href={`https://wa.me/91${o.customer.phone}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                  <br />
                  <small>{o.customer.email}</small>
                </td>
                <td>{o.totals.lines.map((l) => `${l.name} × ${l.qty}`).join(', ')}</td>
                <td>{formatINR(o.totals.dueNow)}</td>
                <td>{o.status === 'failed' ? 'Payment failed' : 'Never paid'}</td>
              </tr>
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={6}>No unfinished checkouts.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
