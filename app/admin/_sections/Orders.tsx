import type { Order, Store } from '@/lib/db'
import { products } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import { INDIAN_STATES } from '@/lib/india'
import {
  cancelAction,
  deliveredAction,
  dispatchAction,
  editOrderAction,
  manualOrderAction,
  markPaidAction,
  noteAction,
  resendAction,
} from '../actions'
import { Back, LABEL, PAY_METHODS, fmtDate } from './shared'
import styles from '../Admin.module.css'

const VIEWS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: 'open', label: 'To dispatch', match: (o) => o.status === 'paid' },
  { key: 'dispatched', label: 'Dispatched', match: (o) => o.status === 'dispatched' },
  { key: 'delivered', label: 'Delivered', match: (o) => o.status === 'delivered' },
  { key: 'cancelled', label: 'Cancelled', match: (o) => o.status === 'cancelled' },
  { key: 'unpaid', label: 'Unpaid', match: (o) => o.status === 'pending' || o.status === 'failed' },
  { key: 'all', label: 'All', match: () => true },
]

const COURIERS = ['Blue Dart', 'Delhivery', 'DTDC', 'India Post', 'Shiprocket', 'Ekart', 'XpressBees', 'Hand delivered']

const matches = (o: Order, q: string) => {
  if (!q) return true
  const hay = [o.number, o.customer.name, o.customer.email, o.customer.phone, o.customer.city, o.customer.pin, o.fulfilment?.tracking ?? '']
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => hay.includes(w))
}

function CustomerFields({ c, gift }: { c?: Order['customer']; gift?: string }) {
  return (
    <>
      <div className={styles.fieldRow}>
        <label>
          Name
          <input name="name" defaultValue={c?.name} required maxLength={80} />
        </label>
        <label>
          Mobile
          <input name="phone" defaultValue={c?.phone} required inputMode="tel" maxLength={16} />
        </label>
      </div>
      <label>
        Email
        <input name="email" type="email" defaultValue={c?.email} required maxLength={120} />
      </label>
      <label>
        Address
        <input name="address1" defaultValue={c?.address1} required maxLength={140} />
      </label>
      <label>
        Address line 2 <small>(optional)</small>
        <input name="address2" defaultValue={c?.address2} maxLength={140} />
      </label>
      <div className={styles.fieldRow3}>
        <label>
          City
          <input name="city" defaultValue={c?.city} required maxLength={60} />
        </label>
        <label>
          State
          <select name="state" defaultValue={c?.state ?? ''} required>
            <option value="" disabled>
              Choose…
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          PIN
          <input name="pin" defaultValue={c?.pin} required inputMode="numeric" maxLength={6} />
        </label>
      </div>
      <label>
        Gift message <small>(optional)</small>
        <input name="gift" defaultValue={gift} maxLength={240} />
      </label>
    </>
  )
}

export default async function Orders({ store, view: viewKey, q }: { store: Store; view: string; q: string }) {
  const orders = await store.listOrders()
  const view = VIEWS.find((v) => v.key === viewKey) ?? (q ? VIEWS[5] : VIEWS[0])
  const backQ = new URLSearchParams({ tab: 'orders', view: view.key, ...(q ? { q } : {}) }).toString()
  const shown = orders.filter((o) => view.match(o) && matches(o, q)).reverse()
  const count = (k: string) => orders.filter(VIEWS.find((v) => v.key === k)!.match).length

  return (
    <>
      <div className={styles.toolbar}>
        <form className={styles.search} action="/admin" method="get" role="search">
          <input type="hidden" name="tab" value="orders" />
          <input type="hidden" name="view" value="all" />
          <input name="q" defaultValue={q} placeholder="Search number, name, email, phone, city, tracking…" aria-label="Search orders" />
          <button className="btn btn--line">Search</button>
          {q && (
            <a href={`/admin?tab=orders&view=${view.key}`} className={styles.clear}>
              Clear
            </a>
          )}
        </form>
        <details className={styles.newOrder}>
          <summary className="btn btn--gold">New order</summary>
          <form action={manualOrderAction} className={`${styles.form} ${styles.newOrderForm}`}>
            <Back q={backQ} />
            <p className={styles.formTitle}>A reservation taken by the concierge</p>
            <div className={styles.fieldRow3}>
              {products.map((f) => (
                <label key={f.slug}>
                  {f.name} · {f.variants[0].size} <small>{formatINR(f.variants[0].price)}</small>
                  <input name={`qty-${f.variants[0].id}`} type="number" min={0} max={50} defaultValue={0} />
                </label>
              ))}
            </div>
            <CustomerFields />
            <div className={styles.fieldRow}>
              <label>
                Payment received by
                <select name="method" defaultValue="UPI" required>
                  {PAY_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                House note <small>(private)</small>
                <input name="note" maxLength={300} />
              </label>
            </div>
            <label className={styles.check}>
              <input type="checkbox" name="email-guest" defaultChecked />
              Email the guest a confirmation
            </label>
            <button className="btn btn--gold">Create paid order</button>
          </form>
        </details>
      </div>

      <nav className={styles.tabs} aria-label="Filter reservations">
        {VIEWS.map((v) => (
          <a key={v.key} href={`/admin?tab=orders&view=${v.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={v.key === view.key ? styles.tabOn : ''}>
            {v.label} <small>{count(v.key)}</small>
          </a>
        ))}
      </nav>
      {q && (
        <p className={styles.hint}>
          {shown.length} result{shown.length === 1 ? '' : 's'} for “{q}”
        </p>
      )}

      <div className={styles.orders}>
        {shown.map((o) => (
          <details key={o.id} id={o.id} className={styles.order} open={shown.length === 1}>
            <summary>
              <span className={styles.num}>{o.number}</span>
              <span className={`${styles.badge} ${styles[o.status]}`}>{LABEL[o.status]}</span>
              <span className={styles.who}>
                {o.customer.name}
                <small>{fmtDate(o.createdAt)}</small>
              </span>
              <span className={styles.items}>{o.totals.lines.map((l) => `${l.name} × ${l.qty}`).join(', ')}</span>
              <span className={styles.amt}>{formatINR(o.totals.dueNow)}</span>
            </summary>

            <div className={styles.body}>
              <div className={styles.cols}>
                <dl className={styles.facts}>
                  <div>
                    <dt>Guest</dt>
                    <dd>
                      {o.customer.name}
                      <br />
                      <a href={`mailto:${o.customer.email}`}>{o.customer.email}</a>
                      <br />
                      <a href={`tel:+91${o.customer.phone}`}>+91 {o.customer.phone}</a>
                      {' · '}
                      <a href={`https://wa.me/91${o.customer.phone}`} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Ship to</dt>
                    <dd>
                      {o.customer.address1}
                      {o.customer.address2 ? <>, {o.customer.address2}</> : null}
                      <br />
                      {o.customer.city}, {o.customer.state} {o.customer.pin}
                    </dd>
                  </div>
                  {o.gift?.message && (
                    <div>
                      <dt>Gift card</dt>
                      <dd>“{o.gift.message}”</dd>
                    </div>
                  )}
                  <div>
                    <dt>Items</dt>
                    <dd>
                      {o.totals.lines.map((l) => (
                        <span key={l.variantId} className={styles.line}>
                          {l.name} × {l.qty} · {formatINR(l.total)}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt>Payment</dt>
                    <dd>
                      {o.payment.provider === 'demo'
                        ? 'Demo (no money taken)'
                        : o.payment.provider === 'manual'
                          ? `Received by the house · ${o.payment.method ?? ''}`
                          : 'Razorpay'}
                      {o.payment.razorpayPaymentId && <small> · {o.payment.razorpayPaymentId}</small>}
                      {o.payment.paidAt && <small> · {fmtDate(o.payment.paidAt)}</small>}
                    </dd>
                  </div>
                  {o.fulfilment?.tracking && (
                    <div>
                      <dt>Shipment</dt>
                      <dd>
                        {o.fulfilment.courier} · {o.fulfilment.tracking}
                        {o.fulfilment.trackingUrl && (
                          <>
                            {' '}
                            ·{' '}
                            <a href={o.fulfilment.trackingUrl} target="_blank" rel="noreferrer">
                              track
                            </a>
                          </>
                        )}
                      </dd>
                    </div>
                  )}
                  {o.refund && (
                    <div>
                      <dt>Refund</dt>
                      <dd>
                        {formatINR(o.refund.amount)} · {o.refund.status === 'manual' ? 'to refund by hand' : o.refund.status}
                        {o.refund.id && <small> · {o.refund.id}</small>}
                      </dd>
                    </div>
                  )}
                </dl>

                <ol className={styles.timeline}>
                  {(o.events ?? []).map((e, i) => (
                    <li key={i}>
                      <b>{e.type.replace(/-/g, ' ')}</b>
                      <small>{fmtDate(e.at)}</small>
                      {e.note && <span>{e.note}</span>}
                    </li>
                  ))}
                </ol>
              </div>

              <div className={styles.actions}>
                {(o.status === 'pending' || o.status === 'failed') && (
                  <form action={markPaidAction} className={styles.form}>
                    <p className={styles.formTitle}>Payment received outside the site</p>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Back q={backQ} />
                    <label>
                      Received by
                      <select name="method" defaultValue="UPI">
                        {PAY_METHODS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.check}>
                      <input type="checkbox" name="email" defaultChecked />
                      Email the guest a confirmation
                    </label>
                    <button className="btn btn--gold">Mark paid</button>
                  </form>
                )}

                {(o.status === 'paid' || o.status === 'dispatched') && (
                  <form action={dispatchAction} className={styles.form}>
                    <p className={styles.formTitle}>{o.status === 'paid' ? 'Dispatch' : 'Update tracking'}</p>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Back q={backQ} />
                    <label>
                      Courier
                      <select name="courier" defaultValue={o.fulfilment?.courier ?? ''} required>
                        <option value="" disabled>
                          Choose…
                        </option>
                        {COURIERS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tracking number
                      <input name="tracking" defaultValue={o.fulfilment?.tracking ?? ''} required maxLength={60} />
                    </label>
                    <label>
                      Tracking link <small>(optional)</small>
                      <input name="trackingUrl" type="url" defaultValue={o.fulfilment?.trackingUrl ?? ''} placeholder="https://" />
                    </label>
                    <label className={styles.check}>
                      <input type="checkbox" name="notify" defaultChecked />
                      Email the guest
                    </label>
                    <button className="btn btn--gold">{o.status === 'paid' ? 'Mark dispatched' : 'Save tracking'}</button>
                  </form>
                )}

                {o.status === 'dispatched' && (
                  <form action={deliveredAction} className={styles.form}>
                    <p className={styles.formTitle}>Delivery</p>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Back q={backQ} />
                    <button className="btn btn--line">Mark delivered</button>
                  </form>
                )}

                <details className={styles.form}>
                  <summary className={styles.formTitle}>Edit guest details</summary>
                  <form action={editOrderAction} className={styles.inner}>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Back q={backQ} />
                    <CustomerFields c={o.customer} gift={o.gift?.message} />
                    <button className="btn btn--line">Save details</button>
                  </form>
                </details>

                <form action={noteAction} className={styles.form}>
                  <p className={styles.formTitle}>House note</p>
                  <input type="hidden" name="orderId" value={o.id} />
                  <Back q={backQ} />
                  <textarea name="note" rows={3} defaultValue={o.note ?? ''} maxLength={1000} />
                  <button className="btn btn--line">Save note</button>
                </form>

                {(o.status === 'paid' || o.status === 'dispatched' || o.status === 'delivered') && (
                  <form action={resendAction} className={styles.form}>
                    <p className={styles.formTitle}>Email</p>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Back q={backQ} />
                    <button className="btn btn--line">Resend confirmation</button>
                    <a href={`/order/${o.id}`} target="_blank" rel="noreferrer" className={styles.guestLink}>
                      Guest&apos;s order page ↗
                    </a>
                  </form>
                )}

                {o.status !== 'cancelled' && o.status !== 'delivered' && (
                  <form action={cancelAction} className={`${styles.form} ${styles.danger}`}>
                    <p className={styles.formTitle}>Cancel</p>
                    <input type="hidden" name="orderId" value={o.id} />
                    <Back q={backQ} />
                    {(o.status === 'paid' || o.status === 'dispatched') && (
                      <label className={styles.check}>
                        <input type="checkbox" name="refund" defaultChecked />
                        Refund {formatINR(o.totals.dueNow)} {o.payment.provider === 'razorpay' ? 'through Razorpay' : '(record only)'}
                      </label>
                    )}
                    <label>
                      Reason <small>(private)</small>
                      <input name="reason" maxLength={300} />
                    </label>
                    <label className={styles.check}>
                      <input type="checkbox" name="confirm" required />I want to cancel {o.number}
                    </label>
                    <button className="btn btn--line">Cancel reservation</button>
                  </form>
                )}
              </div>
            </div>
          </details>
        ))}
        {!shown.length && <p className={styles.empty}>Nothing here.</p>}
      </div>
    </>
  )
}
