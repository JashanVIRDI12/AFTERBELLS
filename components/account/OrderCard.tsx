import Link from 'next/link'
import type { Order } from '@/lib/db'
import { STATUS_LABEL } from '@/lib/account'
import { getProduct } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import styles from './Account.module.css'

export const longDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

/** One order: number, status, what is in it, where it is, and what was paid. */
export default function OrderCard({ order: o }: { order: Order }) {
  const cancelled = o.status === 'cancelled'
  const f = o.fulfilment
  const steps = [
    { label: 'Confirmed', done: true },
    { label: 'On its way', done: o.status === 'dispatched' || o.status === 'delivered' },
    { label: 'Delivered', done: o.status === 'delivered' },
  ]
  return (
    <article className={styles.order} aria-label={`Order ${o.number}`}>
      <div className={styles.orderTop}>
        <p className={styles.number}>
          {o.number}
          <span className={styles.date}>{longDate(o.payment.paidAt ?? o.createdAt)}</span>
        </p>
        <span className={styles.chip} data-status={o.status}>
          {STATUS_LABEL[o.status]}
        </span>
      </div>

      <ul className={styles.items}>
        {o.totals.lines.map((l) => (
          <li key={l.variantId} style={{ '--dot': getProduct(l.slug)?.theme.accent } as React.CSSProperties}>
            <span className={styles.itemName}>
              {l.name}
              {l.size ? ` · ${l.size}` : ''}
              <small>× {l.qty}</small>
            </span>
            <span>{formatINR(l.total)}</span>
          </li>
        ))}
      </ul>

      {!cancelled && (
        <ol className={styles.journey} aria-label="Progress">
          {steps.map((s) => (
            <li key={s.label} className={s.done ? styles.done : undefined}>
              <i aria-hidden />
              {s.label}
            </li>
          ))}
        </ol>
      )}

      <div className={styles.orderFoot}>
        <p className={styles.total}>
          <small>{cancelled ? (o.refund ? 'Refunded' : 'Total') : 'Paid'}</small>
          {formatINR(o.refund?.amount ?? o.totals.dueNow)}
        </p>
        <div className={styles.links}>
          {f?.trackingUrl && o.status === 'dispatched' && (
            <a href={f.trackingUrl} target="_blank" rel="noreferrer" className={styles.more}>
              Track parcel
            </a>
          )}
          <Link href={`/order/${o.id}`} className={styles.more}>
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}
