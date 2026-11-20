import type { Metadata } from 'next'
import Link from 'next/link'
import { detailsOf, memberData, requireMember } from '@/lib/account'
import ConciergePhones from '@/components/ui/ConciergePhones'
import OrderCard from '@/components/account/OrderCard'
import styles from '@/components/account/Account.module.css'

export const metadata: Metadata = { title: 'Your account', robots: { index: false } }

export default async function AccountPage() {
  const email = await requireMember('/account')
  const { profile, orders, fallback } = await memberData(email)
  const d = profile ?? fallback
  const first = d?.name.split(' ')[0]
  const latest = orders[0]
  const addr = detailsOf(d)

  return (
    <>
      <header className={styles.hello}>
        <p className={`t-eyebrow ${styles.kicker}`}>Your account</p>
        <h1 className={styles.title}>{first ? `Welcome, ${first}` : 'Welcome'}</h1>
        <p className={styles.lead}>{email}</p>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="latest-h">
          <header className={styles.panelHead}>
            <h2 id="latest-h" className={styles.panelTitle}>
              Latest order
            </h2>
            {orders.length > 1 && (
              <Link href="/account/orders" className={styles.more}>
                All {orders.length}
              </Link>
            )}
          </header>
          {latest ? (
            <OrderCard order={latest} />
          ) : (
            <div className={styles.empty}>
              <p>You have no orders yet. Any you place with {email} will appear here.</p>
              <Link href="/collection" className="btn btn--line">
                Discover the collection
              </Link>
            </div>
          )}
        </section>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="deliver-h">
            <header className={styles.panelHead}>
              <h2 id="deliver-h" className={styles.panelTitle}>
                Delivery details
              </h2>
              <Link href="/account/profile" className={styles.more}>
                {profile ? 'Edit' : 'Add'}
              </Link>
            </header>
            {profile ? (
              <address className={styles.details} style={{ fontStyle: 'normal' }}>
                <b>{addr.name}</b>
                <span>+91 {addr.phone}</span>
                <span>
                  {addr.address1}
                  {addr.address2 ? `, ${addr.address2}` : ''}
                </span>
                <span>
                  {addr.city}, {addr.state} {addr.pin}
                </span>
              </address>
            ) : (
              <p className={styles.muted}>Save your address once and checkout fills it in for you.</p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="care-h">
            <header className={styles.panelHead}>
              <h2 id="care-h" className={styles.panelTitle}>
                Concierge
              </h2>
            </header>
            <p className={`${styles.muted} ${styles.phones}`}>
              For anything about an order, call or WhatsApp <ConciergePhones />.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
