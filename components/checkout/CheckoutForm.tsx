'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { customerSchema } from '@/lib/checkout-schema'
import { getVariant } from '@/lib/catalog'
import { INDIAN_STATES, lookupPin } from '@/lib/india'
import { depositAvailable, formatINR, priceLines, type Plan } from '@/lib/pricing'
import { site, conciergeLine, isFastPin } from '@/lib/site'
import { useCart, useUI } from '@/lib/stores'
import { refreshStock } from '@/lib/useStock'
import { track, visitOrigin } from '@/lib/track'
import { vials } from '@/lib/content'
import { Peacock } from '@/components/brand/Brand'
import QtyStepper from '@/components/ui/QtyStepper'
import styles from './Checkout.module.css'
import ProductImage from '@/components/product/ProductImage'

type Fields = {
  email: string
  phone: string
  name: string
  address1: string
  address2: string
  city: string
  state: string
  pin: string
}
const EMPTY: Fields = { email: '', phone: '', name: '', address1: '', address2: '', city: '', state: '', pin: '' }

type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void }

function loadRazorpay(): Promise<RazorpayCtor> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { Razorpay?: RazorpayCtor }
    if (w.Razorpay) return resolve(w.Razorpay)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error('Razorpay unavailable')))
    s.onerror = () => reject(new Error('Could not load the payment window'))
    document.body.appendChild(s)
  })
}

export default function CheckoutForm({ initial }: { initial?: Partial<Fields> }) {
  const router = useRouter()
  const hydrated = useUI((s) => s.hydrated)
  const lines = useCart((s) => s.lines)
  const setQty = useCart((s) => s.setQty)
  useEffect(() => {
    track('checkout_view')
  }, [])
  const remove = useCart((s) => s.remove)
  const clear = useCart((s) => s.clear)

  const [f, setF] = useState<Fields>(() => ({ ...EMPTY, ...initial }))
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({})
  const [plan, setPlan] = useState<Plan>('full')
  const [giftOn, setGiftOn] = useState(false)
  const [gift, setGift] = useState('')
  const [waUpdates, setWaUpdates] = useState(false)

  // A six-digit PIN fills in the city and state (only where the guest hasn't typed them).
  const fillFromPin = async (pin: string) => {
    const found = await lookupPin(pin)
    if (!found) return
    setF((p) => (p.pin !== pin ? p : { ...p, city: p.city || found.city, state: p.state || found.state }))
  }
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'paying' | 'demo'>('idle')
  const [error, setError] = useState('')
  const [demo, setDemo] = useState<{ orderId: string; number: string; amount: number } | null>(null)

  const totals = useMemo(() => priceLines(lines, plan), [lines, plan])

  const errors = useMemo(() => {
    const r = customerSchema.safeParse(f)
    const out: Partial<Record<keyof Fields, string>> = {}
    if (!r.success) for (const i of r.error.issues) out[i.path[0] as keyof Fields] ??= i.message
    return out
  }, [f])

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }))
  const blur = (k: keyof Fields) => () => setTouched((t) => ({ ...t, [k]: true }))
  const err = (k: keyof Fields) => (touched[k] ? errors[k] : undefined)

  const finish = (orderId: string) => {
    clear()
    void refreshStock()
    router.push(`/order/${orderId}`)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])))
    if (Object.keys(errors).length) {
      setError('Please complete the highlighted details.')
      const first = Object.keys(errors)[0]
      document.getElementById(`co-${first}`)?.focus()
      return
    }
    setStatus('submitting')
    try {
      track('payment_start')
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lines,
          plan,
          customer: f,
          gift: giftOn && gift.trim() ? { message: gift.trim() } : undefined,
          acceptTerms: true,
          whatsappUpdates: waUpdates,
          origin: visitOrigin(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) void refreshStock()
        throw new Error(data.error ?? 'Something went wrong')
      }

      if (data.mode === 'demo') {
        setDemo({ orderId: data.orderId, number: data.number, amount: data.amount })
        setStatus('demo')
        return
      }

      setStatus('paying')
      const Razorpay = await loadRazorpay()
      const rzp = new Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency,
        name: site.name,
        description: `${site.edition.name} · ${data.number}`,
        prefill: data.prefill,
        theme: { color: '#AC8028' },
        handler: async (r: RazorpayHandlerResponse) => {
          try {
          const v = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ mode: 'razorpay', orderId: data.orderId, ...r }),
          })
          if (v.ok) finish(data.orderId)
          else {
            setStatus('idle')
            setError('We received your payment but could not confirm it automatically. Our concierge will email you shortly.')
          }
          } catch {
            setStatus('idle')
            setError(`Payment confirmation could not be reached. Keep order ${data.number} and call our concierge on ${conciergeLine} before trying another payment.`)
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('idle')
            setError('Payment was not completed. Your bag is saved — you can try again.')
          },
        },
      })
      rzp.on('payment.failed', () => {
        setStatus('idle')
        setError('The payment did not go through. Please try another method.')
      })
      rzp.open()
    } catch (e2) {
      setStatus('idle')
      setError(e2 instanceof Error ? e2.message : 'Something went wrong')
    }
  }

  const completeDemo = async () => {
    if (!demo) return
    setStatus('submitting')
    try {
    const v = await fetch('/api/checkout/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'demo', orderId: demo.orderId }),
    })
    if (v.ok) finish(demo.orderId)
    else {
      setStatus('idle')
      setDemo(null)
      setError('Demo payment failed.')
    }
    } catch {
      setStatus('demo')
      setError('Demo confirmation could not be reached. Please check your connection and try again.')
    }
  }

  if (!hydrated) return <div className={styles.loading} aria-busy="true" />

  if (!totals.lines.length) {
    return (
      <section className={styles.empty} data-header="light">
        <Peacock className={styles.emptyMark} />
        <h1 className="t-title t-h3">Your bag is empty</h1>
        <p>Choose your hour from the First Edition.</p>
        <Link href="/collection" className="btn btn--gold">
          View the collection
        </Link>
      </section>
    )
  }

  const busy = status === 'submitting' || status === 'paying'
  // the delivery promise for this address: next day in Delhi NCR, otherwise the standard window
  const arrival = f.pin.length === 6 ? (isFastPin(f.pin) ? `${site.delivery.fastShort} in ${site.delivery.fastPlace}` : site.delivery.standardShort) : `${site.delivery.fast} · ${site.delivery.standard}`

  const Summary = (
    <div className={styles.summaryInner}>
      <ul className={styles.items}>
        {totals.lines.map((l) => {
          const p = getVariant(l.variantId)?.product
          if (!p) return null
          return (
            <li key={l.variantId} className={styles.item}>
              <span className={styles.thumb} style={{ '--bg': p.theme.bg, '--bg2': p.theme.bg2 } as React.CSSProperties}>
                <ProductImage product={p} />
                <b>{l.qty}</b>
              </span>
              <span className={styles.itemMeta}>
                <span className={`t-name ${styles.itemName}`}>{l.name}</span>
                <span className={styles.itemSub}>
                  {p.concentration}
                  {l.size ? ` · ${l.size}` : ''}
                </span>
                <span className={styles.itemControls}>
                  <QtyStepper value={l.qty} max={site.edition.maxPerVariant} onChange={(q) => setQty(l.variantId, q)} />
                  <button type="button" className={styles.remove} onClick={() => remove(l.variantId)}>
                    Remove
                  </button>
                </span>
              </span>
              <span className={styles.itemPrice}>{formatINR(l.total)}</span>
            </li>
          )
        })}
      </ul>
      <dl className={styles.totals}>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatINR(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{totals.shipping ? formatINR(totals.shipping) : 'Complimentary'}</dd>
        </div>
        <div className={styles.grand}>
          <dt>Total</dt>
          <dd>{formatINR(totals.total)}</dd>
        </div>
        {totals.plan === 'deposit' && (
          <>
            <div className={styles.due}>
              <dt>Due today</dt>
              <dd>{formatINR(totals.dueNow)}</dd>
            </div>
            <div>
              <dt>Balance before dispatch</dt>
              <dd>{formatINR(totals.balance)}</dd>
            </div>
          </>
        )}
      </dl>
      <p className={styles.taxNote}>Inclusive of all taxes · {arrival}</p>
    </div>
  )

  return (
    <section className={styles.checkout} data-header="light">
      <div className={styles.titleBar}>
        <p className="t-eyebrow">{site.edition.name}</p>
        <h1 className="t-title">Checkout</h1>
      </div>

      {/* mobile summary toggle */}
      <button
        type="button"
        className={styles.summaryToggle}
        onClick={() => setSummaryOpen((o) => !o)}
        aria-expanded={summaryOpen}
        aria-controls="co-summary-m"
      >
        <span>
          {summaryOpen ? 'Hide' : 'Show'} order summary · {totals.count} {totals.count === 1 ? 'bottle' : 'bottles'}
        </span>
        <b>{formatINR(totals.total)}</b>
      </button>
      <div id="co-summary-m" aria-hidden={!summaryOpen} inert={!summaryOpen} className={`${styles.summaryMobile} ${summaryOpen ? styles.summaryMobileOpen : ''}`}>
        <div>{Summary}</div>
      </div>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <fieldset className={styles.block}>
            <legend>
              <span>01</span> Contact
            </legend>
            <div className={styles.row2}>
              <Field id="phone" label="Mobile number" error={err('phone')} prefix="+91">
                <input
                  id="co-phone"
                  className={`input ${styles.withPrefix}`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  value={f.phone}
                  onChange={set('phone')}
                  onBlur={blur('phone')}
                  aria-invalid={!!err('phone')}
                  required
                />
              </Field>
              <Field id="email" label="Email" error={err('email')}>
                <input
                  id="co-email"
                  className="input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={f.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  aria-invalid={!!err('email')}
                  required
                />
              </Field>
            </div>
            <p className={styles.hint}>We send your confirmation and tracking here.</p>
            <label className={styles.check}>
              <input type="checkbox" checked={waUpdates} onChange={(e) => setWaUpdates(e.target.checked)} />
              <span className={styles.box} aria-hidden />
              <span>Send my order updates on WhatsApp too.</span>
            </label>
          </fieldset>

          <fieldset className={styles.block}>
            <legend>
              <span>02</span> Delivery
            </legend>
            <Field id="name" label="Full name" error={err('name')}>
              <input id="co-name" className="input" autoComplete="name" value={f.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!err('name')} required />
            </Field>
            <Field id="address1" label="Address" error={err('address1')}>
              <input
                id="co-address1"
                className="input"
                autoComplete="address-line1"
                placeholder="House, building, street"
                value={f.address1}
                onChange={set('address1')}
                onBlur={blur('address1')}
                aria-invalid={!!err('address1')}
                required
              />
            </Field>
            <Field id="address2" label="Apartment, landmark (optional)">
              <input id="co-address2" className="input" autoComplete="address-line2" value={f.address2} onChange={set('address2')} />
            </Field>
            <div className={styles.row3}>
              <Field id="pin" label="PIN code" error={err('pin')}>
                <input
                  id="co-pin"
                  className="input"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={f.pin}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/\D/g, '')
                    setF((p) => ({ ...p, pin }))
                    if (pin.length === 6) void fillFromPin(pin)
                  }}
                  onBlur={blur('pin')}
                  aria-invalid={!!err('pin')}
                  required
                />
              </Field>
              <Field id="city" label="City" error={err('city')}>
                <input id="co-city" className="input" autoComplete="address-level2" value={f.city} onChange={set('city')} onBlur={blur('city')} aria-invalid={!!err('city')} required />
              </Field>
              <Field id="state" label="State" error={err('state')}>
                <select id="co-state" className="input" autoComplete="address-level1" value={f.state} onChange={set('state')} onBlur={blur('state')} aria-invalid={!!err('state')} required>
                  <option value="">Select</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className={styles.hint}>
              {f.pin.length === 6 ? `${arrival}. ` : ''}
              {site.shipping.note}. We currently deliver within India.
            </p>
          </fieldset>

          <fieldset className={styles.block}>
            <legend>
              <span>03</span> A gift?
            </legend>
            <label className={styles.check}>
              <input type="checkbox" checked={giftOn} onChange={(e) => setGiftOn(e.target.checked)} />
              <span className={styles.box} aria-hidden />
              <span>Add a message — we will write it inside the thank-you card. Prices never appear in the parcel.</span>
            </label>
            {giftOn && (
              <div className="field">
                <label htmlFor="co-gift">Your message</label>
                <textarea id="co-gift" className="input" maxLength={240} value={gift} onChange={(e) => setGift(e.target.value)} placeholder="For the hour after the bells…" />
                <span className={styles.count}>{gift.length}/240</span>
              </div>
            )}
          </fieldset>

          {depositAvailable() && (
            <fieldset className={styles.block}>
              <legend>
                <span>04</span> Payment plan
              </legend>
              <div className={styles.plans}>
                {(['full', 'deposit'] as const).map((p) => {
                  const t = priceLines(lines, p)
                  return (
                    <label key={p} className={`${styles.plan} ${plan === p ? styles.planOn : ''}`}>
                      <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} />
                      <span className={styles.planTitle}>{p === 'full' ? 'Pay in full' : `Pay ${site.deposit.percent}% now`}</span>
                      <span className={styles.planPrice}>{formatINR(t.dueNow)} today</span>
                      {p === 'deposit' && <span className={styles.planNote}>{formatINR(t.balance)} before dispatch</span>}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          <div className={styles.payBlock}>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.payBar}>
              <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
                {busy ? (
                  <span className={styles.spinner} aria-label="Processing" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                      <path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    Pay {formatINR(totals.dueNow)}
                  </>
                )}
              </button>
            </div>
            <p className={styles.secure}>Secured by Razorpay · UPI · Cards · Net banking · Wallets</p>
            <p className={styles.secure}>
              By paying you accept our{' '}
              <Link href="/policies#terms" target="_blank">
                terms of sale
              </Link>
              .
            </p>
          </div>
        </form>

        <aside className={styles.summary} aria-label="Order summary">
          <p className="t-eyebrow">Your order</p>
          {Summary}
          <ul className={styles.assure}>
            <li>{vials.body}</li>
            <li>Complimentary delivery · priority concierge</li>
            <li>24k gold flakes · gold metal label · thank-you card</li>
            <li>Cancel free of charge until dispatch</li>
          </ul>
        </aside>
      </div>

      {status === 'demo' && demo && (
        <div className={styles.demoWrap} role="dialog" aria-modal="true" aria-labelledby="demo-title">
          <div className={styles.demo}>
            <Peacock className={styles.demoMark} />
            <p className="t-eyebrow">Demo payment</p>
            <h2 id="demo-title" className="t-display">
              {formatINR(demo.amount)}
            </h2>
            <p>
              Razorpay keys are not configured yet, so no money will be taken. Add <code>RAZORPAY_KEY_ID</code> and{' '}
              <code>RAZORPAY_KEY_SECRET</code> to accept real payments.
            </p>
            <button className="btn btn--gold btn--block" onClick={completeDemo}>
              Complete demo payment
            </button>
            <button
              className={styles.demoCancel}
              onClick={() => {
                setStatus('idle')
                setDemo(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Field({
  id,
  label,
  error,
  prefix,
  children,
}: {
  id: string
  label: string
  error?: string
  prefix?: string
  children: React.ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={`co-${id}`}>{label}</label>
      <div className={prefix ? styles.prefixWrap : undefined}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        {children}
      </div>
      {error && (
        <span className="err" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
