import type { Store } from '@/lib/db'
import { products, getVariant } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import { site } from '@/lib/site'
import { getInventory } from '@/lib/inventory'
import { stockFrom } from '@/lib/stock'
import { inventoryAction } from '../actions'
import { Back, fmtDate } from './shared'
import styles from '../Admin.module.css'

export default async function Inventory({ store }: { store: Store }) {
  const [reserved, inventory, log, orders] = await Promise.all([
    store.reservedByVariant(),
    getInventory(),
    store.listInventoryLog(40),
    store.listOrders(),
  ])
  const stock = stockFrom(reserved, inventory)
  // bottles in each state, from real orders
  const by = (variantId: string, pick: (s: string) => boolean) =>
    orders.filter((o) => pick(o.status)).reduce((n, o) => n + (o.totals.lines.find((l) => l.variantId === variantId)?.qty ?? 0), 0)
  const name = (id: string) => {
    const found = getVariant(id)
    return found ? `${found.product.name} · ${found.variant.size}` : id
  }
  const lowAt = site.edition.lowStockShare

  return (
    <>
      <p className={styles.hint}>
        Edition size and offline sales are yours to set. Reserved bottles come from real orders; holds are guests in the middle of paying (30 minutes).
        Pausing stops new online reservations — the concierge can still take orders here.
      </p>
      <div className={styles.inv}>
        {products.map((f) => {
          const id = f.variants[0].id
          const s = stock[id]
          const inv = inventory[id]
          const paid = by(id, (st) => st === 'paid')
          const dispatched = by(id, (st) => st === 'dispatched')
          const delivered = by(id, (st) => st === 'delivered')
          const holds = Math.max(0, s.online - paid - dispatched - delivered)
          const left = Math.max(0, s.edition - s.reserved)
          const share = s.edition ? left / s.edition : 0
          const state = inv.paused ? 'Paused' : left === 0 ? 'Fully reserved' : share <= lowAt ? 'Few remaining' : 'Open'
          return (
            <form key={id} action={inventoryAction} className={styles.invCard}>
              <Back q="tab=inventory" />
              <input type="hidden" name="variantId" value={id} />
              <header>
                <span className="t-name">{f.name} · {f.variants[0].size}</span>
                <span className={`${styles.badge} ${inv.paused || left === 0 ? styles.cancelled : share <= lowAt ? styles.pending : styles.delivered}`}>{state}</span>
              </header>
              <p className={styles.invPrice}>{formatINR(f.variants[0].price)} · {f.family}</p>

              <div className={styles.invBar} aria-hidden>
                <i style={{ width: `${s.edition ? ((delivered + dispatched) / s.edition) * 100 : 0}%` }} className={styles.barShipped} />
                <i style={{ width: `${s.edition ? (paid / s.edition) * 100 : 0}%` }} className={styles.barPaid} />
                <i style={{ width: `${s.edition ? (s.offline / s.edition) * 100 : 0}%` }} className={styles.barOffline} />
                <i style={{ width: `${s.edition ? (holds / s.edition) * 100 : 0}%` }} className={styles.barHold} />
              </div>
              <dl className={styles.invNums}>
                <div>
                  <dt>Remaining</dt>
                  <dd>
                    <b>{left}</b> of {s.edition}
                  </dd>
                </div>
                <div>
                  <dt>
                    <i className={styles.barPaid} /> Paid · to dispatch
                  </dt>
                  <dd>{paid}</dd>
                </div>
                <div>
                  <dt>
                    <i className={styles.barShipped} /> Dispatched · delivered
                  </dt>
                  <dd>
                    {dispatched} · {delivered}
                  </dd>
                </div>
                <div>
                  <dt>
                    <i className={styles.barOffline} /> Sold offline
                  </dt>
                  <dd>{s.offline}</dd>
                </div>
                <div>
                  <dt>
                    <i className={styles.barHold} /> Holds (paying now)
                  </dt>
                  <dd>{holds}</dd>
                </div>
              </dl>

              <div className={styles.fieldRow}>
                <label>
                  Edition size
                  <input name="editionSize" type="number" min={0} defaultValue={inv.editionSize} required />
                </label>
                <label>
                  Sold offline
                  <input name="offline" type="number" min={0} defaultValue={inv.offline} required />
                </label>
              </div>
              <label className={styles.check}>
                <input type="checkbox" name="paused" defaultChecked={inv.paused} />
                Pause online reservations
              </label>
              <label>
                Note <small>(why, for the log)</small>
                <input name="note" maxLength={200} placeholder="e.g. 12 sold at the launch event" />
              </label>
              <button className="btn btn--gold">Save {f.name}</button>
              {inv.updatedAt && <small className={styles.hint}>Last changed {fmtDate(inv.updatedAt)}</small>}
            </form>
          )
        })}
      </div>

      <h2 className={styles.h2}>Inventory log</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Fragrance</th>
              <th>Change</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {log.map((l, i) => (
              <tr key={i}>
                <td>{fmtDate(l.at)}</td>
                <td>{name(l.variantId)}</td>
                <td>{l.change}</td>
                <td>
                  <small>{l.note ?? ''}</small>
                </td>
              </tr>
            ))}
            {!log.length && (
              <tr>
                <td colSpan={4}>No changes yet — the edition is using the defaults from lib/site.ts.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
