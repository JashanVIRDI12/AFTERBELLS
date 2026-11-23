'use client'

import Link from 'next/link'
import {
  Check,
  CreditCard,
  Gift,
  Landmark,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TestTubeDiagonal,
  Truck,
  Undo2,
  User,
  Video,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { customerSchema } from '@/lib/checkout-schema'
import { getVariant, isFullSize } from '@/lib/catalog'
import { INDIAN_STATES, lookupPin } from '@/lib/india'
import { depositAvailable, formatINR, priceLines, type Plan } from '@/lib/pricing'
import { site, conciergeLine, isFastPin, whatsappLink } from '@/lib/site'
import { GIFT_KEY, useCart, usePin, useUI, useVideo } from '@/lib/stores'
import { VideoPrice, videoCopy } from '@/components/product/VideoOption'
import { refreshStock } from '@/lib/useStock'
import { track, visitOrigin } from '@/lib/track'
import { vials } from '@/lib/content'
import { arrivalLine, validPin } from '@/lib/delivery'
import { whatsappOrderLink } from '@/lib/concierge'
import { cleanPhone, markKnown, sendLead, validEmail, validPhone } from '@/lib/leads'
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

/** What the guest has typed, kept in this browser so a closed tab or a trip to the UPI app loses nothing. */
const DRAFT = 'ab-checkout'
function readDraft(): Partial<Fields> {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) ?? '{}') as Partial<Fields>
    return Object.fromEntries(Object.entries(d).filter(([k, v]) => k in EMPTY && typeof v === 'string')) as Partial<Fields>
  } catch {
    return {}
  }
}

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
  const setUI = useUI((s) => s.set)

  const [f, setF] = useState<Fields>(() => ({ ...EMPTY, ...initial }))
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({})
  const [plan, setPlan] = useState<Plan>('full')
  const [giftOn, setGiftOn] = useState(false)
  // "Make it a gift" on a product page opens the message box here
  useEffect(() => {
    try {
      if (localStorage.getItem(GIFT_KEY) === '1') setGiftOn(true)
    } catch {}
  }, [])
  const [gift, setGift] = useState('')
  // the personalised video comes with any 60 ml bottle, on unless turned off
  const videoOn = useVideo((s) => s.on)
  const setVideo = useVideo((s) => s.setOn)
  const hasFull = lines.some((l) => isFullSize(l.variantId))
  const [waUpdates, setWaUpdates] = useState(false)

  const savedPin = usePin((s) => s.pin)
  const savePin = usePin((s) => s.setPin)
  const [orderNo, setOrderNo] = useState('')

  // A six-digit PIN fills in the city and state (only where the guest hasn't typed them).
  const fillFromPin = async (pin: string) => {
    const found = await lookupPin(pin)
    if (!found) return
    savePin(pin, found.city)
    setF((p) => (p.pin !== pin ? p : { ...p, city: p.city || found.city, state: p.state || found.state }))
  }

  // A PIN code already given on a product page or in the bag starts the delivery address.
  useEffect(() => {
    if (!validPin(savedPin) || f.pin) return
    setF((p) => (p.pin ? p : { ...p, pin: savedPin }))
    void fillFromPin(savedPin)
    // only when the remembered PIN arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPin])
  // Bring back a draft from an earlier visit (only into empty fields: a signed-in profile wins).
  useEffect(() => {
    const d = readDraft()
    if (Object.keys(d).length) setF((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v || d[k as keyof Fields] || ''])) as Fields)
  }, [])
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT, JSON.stringify(f))
      } catch {}
    }, 400)
    return () => window.clearTimeout(t)
  }, [f])

  // A valid email or mobile number is enough for the concierge to help if the order never arrives.
  // Sent a moment after the guest stops typing, and at once if they leave the page.
  const sentLead = useRef('')
  const leadNow = useRef<() => void>(() => {})
  leadNow.current = () => {
    const email = validEmail(f.email) ? f.email.trim() : undefined
    const phone = validPhone(f.phone) ? cleanPhone(f.phone) : undefined
    if ((!email && !phone) || !lines.length) return
    const body = {
      kind: 'checkout' as const,
      email,
      phone,
      name: f.name.trim().length >= 2 ? f.name.trim() : undefined,
      pin: validPin(f.pin) ? f.pin : undefined,
      city: f.city.trim() || undefined,
      lines: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
    }
    const key = JSON.stringify(body)
    if (key === sentLead.current) return
    sentLead.current = key
    void sendLead(body, { keepalive: true })
  }
  useEffect(() => {
    const t = window.setTimeout(() => leadNow.current(), 1500)
    return () => window.clearTimeout(t)
  }, [f.email, f.phone, f.name, f.pin, f.city, lines])
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') leadNow.current()
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [])

  const [summaryOpen, setSummaryOpen] = useState(false)
  // phones: the sticky pay bar shows while the form's own Pay button is out of view
  const payBtn = useRef<HTMLButtonElement>(null)
  const [showPayBar, setShowPayBar] = useState(false)
  useEffect(() => {
    const el = payBtn.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShowPayBar(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
    // the button exists once the bag has hydrated and is not empty
  }, [hydrated, lines.length])
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
    try {
      localStorage.removeItem(DRAFT)
      localStorage.removeItem(GIFT_KEY)
    } catch {}
    markKnown()
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
          video: hasFull && videoOn,
          origin: visitOrigin(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) void refreshStock()
        throw new Error(data.error ?? 'Something went wrong')
      }
      setOrderNo(data.number ?? '')

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
        <Link href="/collection" className="btn btn--ink">
          View the collection
        </Link>
      </section>
    )
  }

  const busy = status === 'submitting' || status === 'paying'
  // the delivery promise for this address, as a date: next day in Delhi NCR, otherwise the standard window
  const pinOk = validPin(f.pin)
  const arrival = pinOk
    ? `${arrivalLine(f.pin)}${isFastPin(f.pin) ? ` in ${site.delivery.fastPlace}` : ''}`
    : `${site.delivery.fast} · ${site.delivery.standard}`
  const waOrder = whatsappOrderLink(lines, { pin: pinOk ? f.pin : undefined, number: orderNo || undefined })
  const ok = (k: keyof Fields) => Boolean(f[k].trim()) && !errors[k]
  const concierge = site.concierge[0]

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
                <span className={styles.itemName}>{l.name}</span>
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
      {hasFull && (
        <div className={`${styles.videoLine} ${videoOn ? '' : styles.videoOff}`}>
          <span className={styles.videoIcon}>
            <Icon name="video" />
          </span>
          <span className={styles.itemMeta}>
            <span className={styles.itemName}>{videoCopy.title}</span>
            <span className={styles.itemSub}>Filmed for you, sent on WhatsApp as your bottle leaves</span>
            <button type="button" className={styles.remove} onClick={() => setVideo(!videoOn)}>
              {videoOn ? 'Remove' : 'Add it back'}
            </button>
          </span>
          {videoOn ? <VideoPrice className={styles.videoPrice} /> : <span className={styles.itemSub}>Not added</span>}
        </div>
      )}
      <dl className={styles.totals}>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatINR(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd className={styles.free}>{totals.shipping ? formatINR(totals.shipping) : 'Complimentary'}</dd>
        </div>
        <div className={styles.grand}>
          <dt>
            Total <small>Inclusive of all taxes</small>
          </dt>
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
      <p className={styles.arrival}>
        <Icon name="truck" />
        <span>{arrival}</span>
      </p>
      <ul className={styles.assure}>
        <li>
          <Icon name="vial" />
          <span>{vials.body}</span>
        </li>
        <li>
          <Icon name="shield" />
          <span>Insured delivery, tracked to your door</span>
        </li>
        <li>
          <Icon name="undo" />
          <span>Cancel free of charge until dispatch</span>
        </li>
        <li>
          <Icon name="gift" />
          <span>Thank-you card in every parcel; prices never inside</span>
        </li>
      </ul>
    </div>
  )

  return (
    <section className={styles.checkout} data-header="light">
      {/* where the guest is: the bag is done, these details, then payment */}
      <ol className={styles.steps} aria-label="Checkout steps">
        <li className={styles.stepDone}>
          <button type="button" onClick={() => setUI({ cartOpen: true })}>
            <span className={styles.stepDot}>
              <Icon name="check" />
            </span>
            Bag
          </button>
        </li>
        <li className={styles.stepOn} aria-current="step">
          <span className={styles.stepDot}>2</span>
          Details
        </li>
        <li>
          <span className={styles.stepDot}>3</span>
          Payment
        </li>
      </ol>

      {/* phones: the order, folded, with its total */}
      <button
        type="button"
        className={styles.summaryToggle}
        onClick={() => setSummaryOpen((o) => !o)}
        aria-expanded={summaryOpen}
        aria-controls="co-summary-m"
      >
        <Icon name="bag" />
        <span>
          {summaryOpen ? 'Hide' : 'Show'} order · {totals.count} {totals.count === 1 ? 'item' : 'items'}
        </span>
        <svg className={`${styles.chev} ${summaryOpen ? styles.chevUp : ''}`} viewBox="0 0 12 8" width="12" height="8" aria-hidden>
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <b>{formatINR(totals.total)}</b>
      </button>
      <div id="co-summary-m" aria-hidden={!summaryOpen} inert={!summaryOpen} className={`${styles.summaryMobile} ${summaryOpen ? styles.summaryMobileOpen : ''}`}>
        <div>{Summary}</div>
      </div>

      <div className={styles.layout}>
        <form id="co-form" className={styles.form} onSubmit={submit} noValidate>
          <header className={styles.formHead}>
            <h1 className={styles.title}>Checkout</h1>
            <ul className={styles.promises}>
              <li>
                <Icon name="lock" /> Secure payment
              </li>
              <li>
                <Icon name="truck" /> Complimentary delivery
              </li>
              <li>
                <Icon name="undo" /> Free cancellation
              </li>
            </ul>
          </header>

          {/* the express way: the concierge takes the order on WhatsApp */}
          <div className={styles.express}>
            <a href={waOrder} target="_blank" rel="noopener noreferrer" className={styles.expressBtn} onClick={() => track('whatsapp_order')}>
              <Icon name="whatsapp" />
              Order on WhatsApp instead
            </a>
            <p className={styles.or}>
              <span>or check out below</span>
            </p>
          </div>

          <div role="group" aria-labelledby="co-h-contact" className={styles.block}>
            <h2 id="co-h-contact" className={styles.legend}>
              <span className={styles.legendIcon}>
                <Icon name="user" />
              </span>
              Contact
            </h2>
            <div className={styles.row2}>
              <Field id="phone" label="Mobile number" error={err('phone')} ok={ok('phone')} prefix="+91">
                <input
                  id="co-phone"
                  className={`input ${styles.withPrefix}`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  placeholder="98765 43210"
                  value={f.phone}
                  onChange={set('phone')}
                  onBlur={blur('phone')}
                  aria-invalid={!!err('phone')}
                  required
                />
              </Field>
              <Field id="email" label="Email" error={err('email')} ok={ok('email')}>
                <input
                  id="co-email"
                  className="input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={f.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  aria-invalid={!!err('email')}
                  required
                />
              </Field>
            </div>
            <p className={styles.hint}>
              Your confirmation and tracking are sent here. We keep these details as you type, so our concierge can help if your order does
              not go through.
              {!initial?.email && (
                <>
                  {' '}
                  Ordered before? <Link href="/account/sign-in?next=/checkout">Sign in</Link>
                </>
              )}
            </p>
            <label className={`${styles.toggle} ${waUpdates ? styles.toggleOn : ''}`}>
              <input type="checkbox" checked={waUpdates} onChange={(e) => setWaUpdates(e.target.checked)} />
              <span className={styles.toggleIcon}>
                <Icon name="whatsapp" />
              </span>
              <span className={styles.toggleText}>
                <b>Order updates on WhatsApp</b>
                <small>Dispatch and delivery messages, nothing else</small>
              </span>
              <span className={styles.switch} aria-hidden />
            </label>
          </div>

          <div role="group" aria-labelledby="co-h-delivery" className={styles.block}>
            <h2 id="co-h-delivery" className={styles.legend}>
              <span className={styles.legendIcon}>
                <Icon name="pin" />
              </span>
              Delivery
            </h2>
            <div className={styles.pinRow}>
              <Field id="pin" label="PIN code" error={err('pin')} ok={pinOk}>
                <input
                  id="co-pin"
                  className="input"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="6 digits"
                  value={f.pin}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/\D/g, '')
                    setF((p) => ({ ...p, pin }))
                    if (validPin(pin)) {
                      savePin(pin)
                      void fillFromPin(pin)
                    }
                  }}
                  onBlur={blur('pin')}
                  aria-invalid={!!err('pin')}
                  aria-describedby="co-arrival"
                  required
                />
              </Field>
              <p id="co-arrival" className={`${styles.when} ${pinOk ? styles.whenOn : ''}`} aria-live="polite">
                <Icon name="truck" />
                <span>
                  {pinOk ? (
                    <>
                      <b>{arrivalLine(f.pin)}</b>
                      {f.city ? ` · ${f.city}` : ''}
                    </>
                  ) : (
                    'Enter your PIN code to see your delivery date'
                  )}
                </span>
              </p>
            </div>
            <Field id="name" label="Full name" error={err('name')} ok={ok('name')}>
              <input id="co-name" className="input" autoComplete="name" value={f.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!err('name')} required />
            </Field>
            <Field id="address1" label="Address" error={err('address1')} ok={ok('address1')}>
              <input
                id="co-address1"
                className="input"
                autoComplete="address-line1"
                placeholder="House or flat no., building, street"
                value={f.address1}
                onChange={set('address1')}
                onBlur={blur('address1')}
                aria-invalid={!!err('address1')}
                required
              />
            </Field>
            <Field id="address2" label="Landmark (optional)">
              <input id="co-address2" className="input" autoComplete="address-line2" placeholder="Area, landmark" value={f.address2} onChange={set('address2')} />
            </Field>
            <div className={styles.row2}>
              <Field id="city" label="City" error={err('city')} ok={ok('city')}>
                <input id="co-city" className="input" autoComplete="address-level2" value={f.city} onChange={set('city')} onBlur={blur('city')} aria-invalid={!!err('city')} required />
              </Field>
              <Field id="state" label="State" error={err('state')} ok={ok('state')}>
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
          </div>

          <div role="group" aria-labelledby="co-h-gift" className={styles.block}>
            <h2 id="co-h-gift" className={styles.legend}>
              <span className={styles.legendIcon}>
                <Icon name="gift" />
              </span>
              A gift?
            </h2>
            <label className={`${styles.toggle} ${giftOn ? styles.toggleOn : ''}`}>
              <input type="checkbox" checked={giftOn} onChange={(e) => setGiftOn(e.target.checked)} />
              <span className={styles.toggleIcon}>
                <Icon name="message" />
              </span>
              <span className={styles.toggleText}>
                <b>Add a message to the thank-you card</b>
                <small>Written by hand inside the card. Prices never appear in the parcel.</small>
              </span>
              <span className={styles.switch} aria-hidden />
            </label>
            {giftOn && (
              <div className={`field ${styles.giftField}`}>
                <label htmlFor="co-gift">Your message</label>
                <textarea id="co-gift" className="input" maxLength={240} value={gift} onChange={(e) => setGift(e.target.value)} placeholder="For the hour after the bells…" />
                <span className={styles.count}>{gift.length}/240</span>
              </div>
            )}
          </div>

          {depositAvailable() && (
            <div role="group" aria-labelledby="co-h-plan" className={styles.block}>
              <h2 id="co-h-plan" className={styles.legend}>Payment plan</h2>
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
            </div>
          )}

          <div role="group" aria-labelledby="co-h-payment" className={`${styles.block} ${styles.payBlock}`}>
            <h2 id="co-h-payment" className={styles.legend}>
              <span className={styles.legendIcon}>
                <Icon name="lock" />
              </span>
              Payment
            </h2>
            <ul className={styles.methods} aria-label="Ways to pay">
              <li>
                <Icon name="upi" />
                UPI
              </li>
              <li>
                <Icon name="card" />
                Cards
              </li>
              <li>
                <Icon name="bank" />
                Net banking
              </li>
              <li>
                <Icon name="wallet" />
                Wallets
              </li>
            </ul>
            <p className={styles.methodsNote}>You choose how to pay in the next step, in Razorpay&apos;s secure window. We never see your card details.</p>

            {error && (
              <div className={styles.error} role="alert">
                <p>{error}</p>
                <a href={waOrder} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_order')}>
                  Complete your order with our concierge on WhatsApp
                </a>
              </div>
            )}

            <button ref={payBtn} type="submit" className={`btn btn--ink btn--block ${styles.pay}`} disabled={busy}>
              {busy ? (
                <span className={styles.spinner} aria-label="Processing" />
              ) : (
                <>
                  <Icon name="lock" />
                  Pay {formatINR(totals.dueNow)} securely
                </>
              )}
            </button>
            <p className={styles.secure}>
              By paying you accept our{' '}
              <Link href="/policies#terms" target="_blank">
                terms of sale
              </Link>
              . Need help? <a href={`tel:${concierge.tel}`}>{concierge.display}</a>
            </p>
          </div>
        </form>

        <aside className={styles.summary} aria-label="Order summary">
          <p className={styles.summaryTitle}>
            Your order <span>({totals.count})</span>
          </p>
          {Summary}
          <a href={whatsappLinkFor(lines)} target="_blank" rel="noopener noreferrer" className={styles.help} onClick={() => track('concierge_whatsapp')}>
            <Icon name="whatsapp" />
            <span>
              <b>Questions before you pay?</b>
              <small>Our concierge answers on WhatsApp, or call {concierge.display}</small>
            </span>
          </a>
        </aside>
      </div>

      {/* phones: the total and the button stay in reach while the form is filled */}
      <div className={`${styles.payBar} ${showPayBar ? styles.payBarOn : ''}`} aria-hidden={!showPayBar} inert={!showPayBar}>
        <span className={styles.payBarTotal}>
          <small>Total</small>
          {formatINR(totals.dueNow)}
        </span>
        <button type="submit" form="co-form" className={`btn btn--ink ${styles.payBarBtn}`} disabled={busy}>
          <Icon name="lock" />
          Pay securely
        </button>
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
            <button className="btn btn--ink btn--block" onClick={completeDemo}>
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

/** A WhatsApp chat with the concierge about this bag, before paying */
const whatsappLinkFor = (lines: { variantId: string; qty: number }[]) =>
  whatsappLink(
    `Hello After Bells, I have a question before I pay for ${lines
      .map((l) => `${getVariant(l.variantId)?.product.name ?? ''}${l.qty > 1 ? ` × ${l.qty}` : ''}`)
      .filter(Boolean)
      .join(', ')}.`,
  )

function Field({
  id,
  label,
  error,
  ok,
  prefix,
  children,
}: {
  id: string
  label: string
  error?: string
  ok?: boolean
  prefix?: string
  children: React.ReactNode
}) {
  return (
    <div className={`field ${styles.field} ${ok && !error ? styles.fieldOk : ''}`}>
      <label htmlFor={`co-${id}`}>{label}</label>
      <div className={styles.control}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        {children}
        <span className={styles.tick} aria-hidden>
          <Icon name="check" />
        </span>
      </div>
      {error && (
        <span className="err" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

/** Lucide icons (lucide-react), at the house's fine line weight; WhatsApp keeps its own mark. */
const ICONS = {
  check: Check,
  user: User,
  pin: MapPin,
  truck: Truck,
  gift: Gift,
  lock: Lock,
  shield: ShieldCheck,
  undo: Undo2,
  vial: TestTubeDiagonal,
  bag: ShoppingBag,
  card: CreditCard,
  message: Mail,
  upi: Smartphone,
  bank: Landmark,
  wallet: Wallet,
  video: Video,
} satisfies Record<string, LucideIcon>

const WHATSAPP =
  'M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2zM8.9 7.8c.2 0 .5 0 .7.5l.8 1.9c.1.2.1.4 0 .6l-.6.7c-.1.2-.1.3 0 .5a7 7 0 0 0 3.3 2.9c.2.1.4.1.5-.1l.8-.9c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.4 0 .5-.2 1.4-1.1 1.9-.8.5-1.8.5-3.5-.2a10 10 0 0 1-4.6-4.3c-.7-1.3-.8-2.6-.2-3.5.4-.6.8-.8 1-.8z'

function Icon({ name }: { name: keyof typeof ICONS | 'whatsapp' }) {
  if (name === 'whatsapp') {
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path d={WHATSAPP} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    )
  }
  const C = ICONS[name]
  return <C className={styles.icon} size={18} strokeWidth={1.4} aria-hidden />
}
