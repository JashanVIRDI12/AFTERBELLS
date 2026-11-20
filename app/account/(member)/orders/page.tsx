import type { Metadata } from 'next'
import Link from 'next/link'
import { memberData, requireMember } from '@/lib/account'
import OrderCard from '@/components/account/OrderCard'
import styles from '@/components/account/Account.module.css'

export const metadata: Metadata = { title: 'Your orders', robots: { index: false } }

export default async function OrdersPage() {
  const email = await requireMember('/account/orders')
  const { orders } = await memberData(email)

  return (
    <>
      <header className={styles.hello}>
        <p className={`t-eyebrow ${styles.kicker}`}>Your account</p>
        <h1 className={styles.title}>Orders</h1>
        <p className={styles.lead}>Every order placed with {email}, newest first.</p>
      </header>

      {orders.length ? (
        <ol className={styles.list}>
          {orders.map((o) => (
            <li key={o.id} className={styles.panel}>
              <OrderCard order={o} />
            </li>
          ))}
        </ol>
      ) : (
        <section className={`${styles.panel} ${styles.empty}`}>
          <p>No orders yet. When you order with this email, it will appear here with its delivery updates.</p>
          <Link href="/collection" className="btn btn--line">
            Discover the collection
          </Link>
        </section>
      )}
    </>
  )
}
