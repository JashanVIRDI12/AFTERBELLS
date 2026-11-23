import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { checkAdmin } from '@/lib/admin-auth'
import { getStore, storageDurable } from '@/lib/db'
import { emailEnabled } from '@/lib/email'
import { razorpayEnabled } from '@/lib/razorpay'
import Overview from './_sections/Overview'
import Orders from './_sections/Orders'
import Inventory from './_sections/Inventory'
import Customers from './_sections/Customers'
import Insights from './_sections/Insights'
import Salon from './_sections/Salon'
import FeedbackList from './_sections/Feedback'
import Leads from './_sections/Leads'
import styles from './Admin.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'House admin', robots: { index: false, follow: false } }

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'leads', label: 'Leads' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customers', label: 'Customers' },
  { key: 'insights', label: 'Insights' },
  { key: 'salon', label: 'Salon' },
  { key: 'feedback', label: 'Feedback' },
] as const

export default async function AdminPage(props: PageProps<'/admin'>) {
  if (!checkAdmin((await headers()).get('authorization'))) notFound()
  const sp = await props.searchParams
  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const tab = TABS.find((t) => t.key === str('tab'))?.key ?? 'overview'
  const ok = str('ok')
  const err = str('err')
  const store = await getStore()

  return (
    <section className={styles.admin} data-header="light">
      <header className={styles.head}>
        <p className="t-eyebrow">House admin</p>
        <h1 className="t-title">The ledger</h1>
        <div className={styles.sys}>
          <span className={store.kind === 'postgres' ? styles.on : storageDurable() ? styles.warn : styles.off}>
            Storage · {store.kind === 'postgres' ? 'Postgres' : 'local files'}
          </span>
          <span className={razorpayEnabled() ? styles.on : styles.off}>Payments · {razorpayEnabled() ? 'Razorpay' : 'not configured'}</span>
          <span className={emailEnabled() ? styles.on : styles.warn}>Email · {emailEnabled() ? 'on' : 'off'}</span>
        </div>
        {!storageDurable() && (
          <p className={styles.alert}>
            This host cannot keep files. Set DATABASE_URL before taking reservations — checkout is paused until then.
          </p>
        )}
      </header>

      <nav className={styles.mainTabs} aria-label="Admin sections">
        {TABS.map((t) => (
          <a key={t.key} href={`/admin?tab=${t.key}`} className={t.key === tab ? styles.mainTabOn : ''} aria-current={t.key === tab ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>

      {ok && <p className={styles.flashOk}>{ok}</p>}
      {err && <p className={styles.flashErr}>{err}</p>}

      {tab === 'overview' && <Overview store={store} />}
      {tab === 'orders' && <Orders store={store} view={str('view')} q={str('q')} />}
      {tab === 'leads' && <Leads store={store} view={str('view')} />}
      {tab === 'inventory' && <Inventory store={store} />}
      {tab === 'customers' && <Customers store={store} />}
      {tab === 'insights' && <Insights store={store} days={Number(str('days')) || 30} />}
      {tab === 'salon' && <Salon store={store} />}
      {tab === 'feedback' && <FeedbackList store={store} />}
    </section>
  )
}
