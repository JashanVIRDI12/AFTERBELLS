import type { Store } from '@/lib/db'
import { fragrances } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import styles from '../Admin.module.css'

const RANGES = [7, 30, 90]

/** A ranked list with a thin bar per row (single series, value printed in ink). */
function Ranked({ title, rows, unit = 'visitors' }: { title: string; rows: { key: string; n: number }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{title}</h3>
      {rows.length ? (
        <ol className={styles.ranked}>
          {rows.map((r) => (
            <li key={r.key} title={`${r.key}: ${r.n} ${unit}`}>
              <span className={styles.rankKey}>{r.key}</span>
              <span className={styles.rankVal}>{r.n}</span>
              <i style={{ width: `${(r.n / max) * 100}%` }} />
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.hint}>No data yet.</p>
      )}
    </div>
  )
}

export default async function Insights({ store, days }: { store: Store; days: number }) {
  const range = RANGES.includes(days) ? days : 30
  const since = new Date(Date.now() - range * 864e5)
  since.setHours(0, 0, 0, 0)
  const [stats, orders] = await Promise.all([store.eventStats(since), store.listOrders()])
  const paid = orders.filter(
    (o) => (o.status === 'paid' || o.status === 'dispatched' || o.status === 'delivered') && new Date(o.payment.paidAt ?? o.createdAt) >= since,
  )
  const revenue = paid.reduce((s, o) => s + o.totals.dueNow, 0)

  // one bar per day, including the quiet ones
  const byDay = new Map(stats.byDay.map((d) => [d.day, d]))
  const daysList: { day: string; visitors: number; views: number }[] = []
  for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    daysList.push(byDay.get(key) ?? { day: key, visitors: 0, views: 0 })
  }
  const peak = Math.max(1, ...daysList.map((d) => d.visitors))
  const fmtShort = (key: string) => new Date(key + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  const funnel = [
    { label: 'Visited the site', n: stats.visitors },
    { label: 'Viewed a fragrance', n: stats.reach.product_view ?? 0 },
    { label: 'Added to bag', n: stats.reach.add_to_bag ?? 0 },
    { label: 'Reached checkout', n: stats.reach.checkout_view ?? 0 },
    { label: 'Started payment', n: stats.reach.payment_start ?? 0 },
    { label: 'Paid reservations', n: paid.length },
  ]
  const top = Math.max(1, funnel[0].n)
  const pct = (n: number) => (top ? `${Math.round((n / top) * 1000) / 10}%` : '—')

  // the visit source saved on each order at checkout (campaign tag, else referring site)
  const salesBySource = Object.entries(
    paid.reduce<Record<string, number>>((m, o) => {
      const key = o.origin?.campaign ? `${o.origin.source || 'Campaign'} · ${o.origin.campaign}` : o.origin?.source || 'Direct or unknown'
      m[key] = (m[key] ?? 0) + 1
      return m
    }, {}),
  )
    .map(([key, n]) => ({ key, n }))
    .sort((a, b) => b.n - a.n)

  const paidBottles = (slug: string) =>
    paid.reduce((n, o) => n + o.totals.lines.filter((l) => l.slug === slug).reduce((m, l) => m + l.qty, 0), 0)
  const actions = [
    { key: 'Concierge calls (tapped a number)', n: stats.events.concierge_call ?? 0 },
    { key: 'Concierge WhatsApp chats', n: stats.events.concierge_whatsapp ?? 0 },
    { key: 'Discovery set waitlist', n: stats.events.discovery_waitlist ?? 0 },
    { key: 'Instagram taps', n: stats.events.instagram_click ?? 0 },
    { key: 'Joined the Salon', n: stats.events.salon_join ?? 0 },
    { key: 'Tracked a reservation', n: stats.events.track_lookup ?? 0 },
  ]

  return (
    <>
      <div className={styles.toolbar}>
        <nav className={styles.tabs} aria-label="Period">
          {RANGES.map((r) => (
            <a key={r} href={`/admin?tab=insights&days=${r}`} className={r === range ? styles.tabOn : ''}>
              {r} days
            </a>
          ))}
        </nav>
        <p className={styles.hint}>Anonymous visits only — no names, emails or IP addresses. Visitors with “Do Not Track” are not counted.</p>
      </div>

      <div className={styles.kpis}>
        <div>
          <span>Visitors</span>
          <b>{stats.visitors}</b>
        </div>
        <div>
          <span>Visits · page views</span>
          <b>
            {stats.sessions} <small>· {stats.pageViews}</small>
          </b>
        </div>
        <div>
          <span>Paid reservations</span>
          <b>{paid.length}</b>
        </div>
        <div>
          <span>Revenue</span>
          <b>{formatINR(revenue)}</b>
        </div>
        <div>
          <span>Conversion</span>
          <b>{stats.visitors ? `${((paid.length / stats.visitors) * 100).toFixed(1)}%` : '—'}</b>
        </div>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Visitors per day</h3>
        <div className={styles.chart} role="img" aria-label={`Visitors per day over the last ${range} days, peaking at ${peak}`}>
          <span className={styles.chartMax}>{peak}</span>
          <div className={styles.bars}>
            {daysList.map((d) => (
              <span key={d.day} className={styles.barCol} title={`${fmtShort(d.day)}: ${d.visitors} visitors · ${d.views} page views`}>
                <i style={{ height: `${(d.visitors / peak) * 100}%` }} />
              </span>
            ))}
          </div>
          <div className={styles.chartAxis}>
            <span>{fmtShort(daysList[0].day)}</span>
            <span>{fmtShort(daysList[Math.floor(daysList.length / 2)].day)}</span>
            <span>{fmtShort(daysList[daysList.length - 1].day)}</span>
          </div>
        </div>
        <details className={styles.tableToggle}>
          <summary>View as table</summary>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Visitors</th>
                  <th>Page views</th>
                </tr>
              </thead>
              <tbody>
                {[...daysList].reverse().map((d) => (
                  <tr key={d.day}>
                    <td>{fmtShort(d.day)}</td>
                    <td>{d.visitors}</td>
                    <td>{d.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>From visit to reservation</h3>
        <ol className={styles.funnel}>
          {funnel.map((f) => (
            <li key={f.label} title={`${f.label}: ${f.n} (${pct(f.n)} of visitors)`}>
              <span className={styles.rankKey}>{f.label}</span>
              <span className={styles.rankVal}>
                {f.n} <small>{pct(f.n)}</small>
              </span>
              <i style={{ width: `${Math.max(f.n ? 1.5 : 0, (f.n / top) * 100)}%` }} />
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Fragrances</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fragrance</th>
                <th>Page views</th>
                <th>Added to bag</th>
                <th>Add rate</th>
                <th>Bottles paid</th>
              </tr>
            </thead>
            <tbody>
              {fragrances.map((f) => {
                const p = stats.products.find((x) => x.slug === f.slug) ?? { views: 0, adds: 0 }
                return (
                  <tr key={f.slug}>
                    <td>{f.name}</td>
                    <td>{p.views}</td>
                    <td>{p.adds}</td>
                    <td>{p.views ? `${Math.round((p.adds / p.views) * 100)}%` : '—'}</td>
                    <td>{paidBottles(f.slug)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.panels}>
        <Ranked title="Where visitors come from" rows={stats.sources} />
        <Ranked title="Where paid reservations come from" rows={salesBySource} unit="reservations" />
        <Ranked title="Devices" rows={stats.devices} />
        <Ranked title="Places" rows={stats.places} />
        <Ranked title="Most viewed pages" rows={stats.topPages} unit="views" />
        <Ranked title="Actions" rows={actions} unit="times" />
      </div>
      <p className={styles.hint}>
        Places appear once the site is hosted on Vercel (it estimates city and country without storing the IP). Tag links you share — e.g.
        <code> ?utm_source=instagram&amp;utm_campaign=launch</code> — to see each campaign under “Where visitors come from”.
      </p>
    </>
  )
}
