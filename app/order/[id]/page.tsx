import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrder } from '@/lib/orders'
import { formatINR } from '@/lib/pricing'
import { nextSteps } from '@/lib/content'
import { site, isFastPin, whatsappLink } from '@/lib/site'
import { emailEnabled } from '@/lib/email'
import { Emblem, Divider } from '@/components/brand/Brand'
import ClearBag from '@/components/checkout/ClearBag'
import styles from './Order.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }

export default async function OrderPage(props: PageProps<'/order/[id]'>) {
  const { id } = await props.params
  const order = await getOrder(id)
  if (!order) notFound()

  const paid = order.status === 'paid' || order.status === 'dispatched' || order.status === 'delivered'
  const cancelled = order.status === 'cancelled'
  const first = order.customer.name.split(' ')[0]
  const f = order.fulfilment
  const fmt = (s?: string) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
  const journey = [
    { label: 'Confirmed', done: paid, at: fmt(order.payment.paidAt ?? order.createdAt) },
    { label: 'Dispatched', done: order.status === 'dispatched' || order.status === 'delivered', at: fmt(f?.dispatchedAt) },
    { label: 'Delivered', done: order.status === 'delivered', at: fmt(f?.deliveredAt) },
  ]

  return (
    <section className={styles.page} data-header="light">
      {order.status === 'paid' && <ClearBag />}
      <div className={styles.card}>
        <Emblem className={styles.emblem} shine />
        <p className={`t-eyebrow lockup ${styles.lock}`}>Reserved for the exceptional</p>

        {cancelled ? (
          <>
            <h1 className={styles.thanks}>
              <span className="gold-text">Cancelled</span>
            </h1>
            <p className={styles.sub}>
              {first}, this order has been cancelled.
              {order.refund
                ? order.refund.status === 'manual'
                  ? ` Our concierge will arrange your refund of ${formatINR(order.refund.amount)}.`
                  : ` A refund of ${formatINR(order.refund.amount)} has been issued to your original payment method.`
                : ''}
            </p>
          </>
        ) : paid ? (
          <>
            <h1 className={styles.thanks}>
              <span className="gold-text">{order.status === 'dispatched' ? 'On its way' : order.status === 'delivered' ? 'Delivered' : 'Thank You'}</span>
            </h1>
            <p className={styles.sub}>
              {order.status === 'dispatched'
                ? `${first}, your order has left the house, sealed and on its way.`
                : order.status === 'delivered'
                  ? `${first}, your After Bells has arrived. We hope it finds its hour.`
                  : `${first}, your order from the ${site.edition.name} is confirmed.`}
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.thanks}>
              <span className="gold-text">Almost there</span>
            </h1>
            <p className={styles.sub}>
              We have not yet received payment for this order. If you have paid, it may take a moment to
              confirm — otherwise you can return to your bag and try again.
            </p>
          </>
        )}

        <Divider className={styles.div} />

        <dl className={styles.meta}>
          <div>
            <dt>Order</dt>
            <dd>{order.number}</dd>
          </div>
          <div>
            <dt>{paid ? 'Paid' : 'Amount'}</dt>
            <dd>{formatINR(order.totals.dueNow)}</dd>
          </div>
          <div>
            <dt>Delivering to</dt>
            <dd>
              {order.customer.city}, {order.customer.state}
            </dd>
          </div>
          <div>
            <dt>{f?.tracking ? 'Courier' : 'Delivery'}</dt>
            <dd>{f?.tracking ? `${f.courier} · ${f.tracking}` : isFastPin(order.customer.pin) ? site.delivery.fastShort : site.delivery.standardShort}</dd>
          </div>
        </dl>

        {paid && (
          <ol className={styles.journey} aria-label="Your order">
            {journey.map((j) => (
              <li key={j.label} className={j.done ? styles.done : ''}>
                <i aria-hidden />
                <b>{j.label}</b>
                {j.done && j.at && <small>{j.at}</small>}
              </li>
            ))}
          </ol>
        )}
        {f?.trackingUrl && order.status === 'dispatched' && (
          <a href={f.trackingUrl} target="_blank" rel="noreferrer" className={`btn btn--gold ${styles.track}`}>
            Track your parcel
          </a>
        )}

        <ul className={styles.items}>
          {order.totals.lines.map((l) => (
            <li key={l.variantId}>
              <span className="t-name">
                {l.name}
                {l.size ? ` · ${l.size}` : ''}
              </span>
              <span>× {l.qty}</span>
              <span>{formatINR(l.total)}</span>
            </li>
          ))}
        </ul>
        {order.totals.balance > 0 && (
          <p className={styles.balance}>Balance of {formatINR(order.totals.balance)} due before dispatch.</p>
        )}
        {order.video && (
          <p className={styles.videoNote}>
            <span className="t-eyebrow">Your personalised video</span>
            Filmed for you by the house and sent on WhatsApp to +91 {order.customer.phone} as your bottle leaves.
          </p>
        )}
        {order.gift?.message && (
          <blockquote className={styles.gift}>
            <span className="t-eyebrow">Your gift message</span>“{order.gift.message}”
          </blockquote>
        )}

        {!cancelled && <p className={styles.mail}>
          {paid && emailEnabled()
            ? `A confirmation has been sent to ${order.customer.email}.`
            : `Please keep your order number. We will write to ${order.customer.email} when it is dispatched.`}
        </p>}
      </div>

      {order.status === 'paid' && (
        <div className={styles.next}>
          <p className="t-eyebrow">What happens next</p>
          <ol>
            {nextSteps.map((s) => (
              <li key={s.no}>
                <span>{s.no}</span>
                <b>{s.title}</b>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className={styles.extras}>
            <p className="t-eyebrow">Before it leaves the house</p>
            <p>
              Something to add, a 15 ml to carry or a bottle to give? Tell the concierge before dispatch and it travels in the same parcel,
              with complimentary delivery.
            </p>
            <a
              href={whatsappLink(`Hello After Bells, I would like to add to my order ${order.number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--line"
            >
              Add to this parcel on WhatsApp
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I have just ordered from After Bells, perfumes made in India with flakes of 24k gold drifting in every bottle: ${site.url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shareLink}
            >
              Tell a friend on WhatsApp
            </a>
          </div>
          <p className={styles.share}>
            Share your moment and tag us on Instagram{' '}
            <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer">
              @{site.instagram}
            </a>
          </p>
          <Link href="/" className="btn btn--line">
            Return to the house
          </Link>
          <Link href="/account/orders" className={styles.share}>
            See all your orders in your account
          </Link>
        </div>
      )}
      {!paid && !cancelled && (
        <div className={styles.next}>
          <Link href="/checkout" className="btn btn--gold">
            Return to checkout
          </Link>
        </div>
      )}
      {(cancelled || order.status === 'dispatched' || order.status === 'delivered') && (
        <div className={styles.next}>
          <Link href="/client-care" className="btn btn--line">
            Client care
          </Link>
        </div>
      )}
    </section>
  )
}
