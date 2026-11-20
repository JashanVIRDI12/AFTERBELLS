'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { useDialogFocus } from '@/lib/useDialogFocus'
import { fragrances, getVariant, productHref } from '@/lib/catalog'
import { formatINR, priceLines } from '@/lib/pricing'
import { site } from '@/lib/site'
import { useCart, useUI } from '@/lib/stores'
import { Peacock } from '@/components/brand/Brand'
import QtyStepper from '@/components/ui/QtyStepper'
import ReserveNote from '@/components/ui/ReserveNote'
import ProductImage from '@/components/product/ProductImage'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const open = useUI((s) => s.cartOpen)
  const hydrated = useUI((s) => s.hydrated)
  const set = useUI((s) => s.set)
  const lines = useCart((s) => s.lines)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const add = useCart((s) => s.add)
  const totals = useMemo(() => priceLines(lines), [lines])
  const sheet = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [drag, setDrag] = useState(0)
  const dragStart = useRef<number | null>(null)

  const close = () => set({ cartOpen: false })

  useDialogFocus(open, sheet, close)

  // Drag-to-dismiss on the mobile sheet handle.
  const onDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return
    setDrag(Math.max(0, e.clientY - dragStart.current))
  }
  const onUp = () => {
    if (dragStart.current === null) return
    dragStart.current = null
    if (drag > 120) close()
    setDrag(0)
  }

  const giftInBag = lines.some((l) => l.variantId === '15ml-gift-set')
  const missing = giftInBag ? [] : fragrances.filter((f) => !lines.some((l) => getVariant(l.variantId)?.product.name === f.name))
  const suggestions = missing.slice(0, 2)

  return (
    <>
      <div className={`${styles.scrim} ${open ? styles.scrimOn : ''}`} onClick={close} aria-hidden />
      <aside
        ref={sheet}
        className={`${styles.drawer} ${open ? styles.open : ''}`}
        style={drag ? { transform: `translate3d(0, ${drag}px, 0)`, transition: 'none' } : undefined}
        aria-label="Your bag"
        aria-hidden={!open}
        inert={!open}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={styles.handle}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-hidden
        >
          <span />
        </div>

        <header className={styles.head}>
          <div>
            <p className="t-eyebrow">{site.edition.name}</p>
            <h2 className={styles.title}>Your bag</h2>
          </div>
          <button ref={closeBtn} className={styles.close} onClick={close} aria-label="Close bag">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </header>

        <div className={styles.body} data-lenis-prevent>
          {hydrated && totals.lines.length === 0 && (
            <div className={styles.empty}>
              <Peacock className={styles.emptyMark} />
              <p className={styles.emptyTitle}>Your bag is waiting.</p>
              <p className="t-small">Choose your hour. Every bottle travels with three 2 ml vials and complimentary delivery.</p>
              <Link href="/collection" className={`btn btn--gold ${styles.emptyCta}`} onClick={close}>
                View the collection
              </Link>
            </div>
          )}

          {totals.lines.length > 0 && (
            <ul className={styles.lines}>
              {totals.lines.map((l) => {
                const f = getVariant(l.variantId)?.product
                if (!f) return null
                return (
                  <li key={l.variantId} className={styles.line}>
                    <Link
                      href={productHref(f)}
                      onClick={close}
                      className={styles.thumb}
                      style={{ '--bg': f.theme.bg, '--bg2': f.theme.bg2 } as React.CSSProperties}
                    >
                      <ProductImage product={f} />
                    </Link>
                    <div className={styles.meta}>
                      <p className={`t-name ${styles.name}`}>{l.name}</p>
                      <p className={styles.sub}>
                        {f.concentration}
                        {l.size ? ` · ${l.size}` : ''}
                      </p>
                      <p className={styles.ships}>Complimentary delivery</p>
                      <div className={styles.row}>
                        <QtyStepper value={l.qty} max={site.edition.maxPerVariant} onChange={(q) => setQty(l.variantId, q)} />
                        <button className={styles.remove} onClick={() => remove(l.variantId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className={styles.price}>{formatINR(l.total)}</p>
                  </li>
                )
              })}
            </ul>
          )}

          {hydrated && suggestions.length > 0 && (
            <div className={styles.suggest}>
              <p className="t-eyebrow">{totals.lines.length ? 'Complete the hours' : 'The collection'}</p>
              <ul>
                {suggestions.map((f) => (
                  <li key={f.slug} className={styles.sItem}>
                    <span
                      className={styles.sThumb}
                      style={{ '--bg': f.theme.bg, '--bg2': f.theme.bg2 } as React.CSSProperties}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.image} alt="" width={80} height={100} />
                    </span>
                    <span className={styles.sMeta}>
                      <span className={`t-name ${styles.sName}`}>{f.name}</span>
                      <span className={styles.sub}>
                        {formatINR(f.variants[0].price)} · {f.variants[0].size}
                      </span>
                    </span>
                    <button className={styles.sAdd} onClick={() => add(f.variants[0].id)} aria-label={`Add ${f.name}`}>
                      Add
                    </button>
                  </li>
                ))}
              </ul>
              {missing.length > 1 && (
                <button className={`btn btn--line btn--block ${styles.set}`} onClick={() => missing.forEach((f) => add(f.variants[0].id))}>
                  {missing.length === fragrances.length ? 'Add all three hours' : 'Add the other two hours'} ·{' '}
                  {formatINR(missing.reduce((n, f) => n + f.variants[0].price, 0))}
                </button>
              )}
            </div>
          )}
        </div>

        {totals.lines.length > 0 && (
          <footer className={styles.foot}>
            <dl className={styles.sum}>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatINR(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{totals.shipping ? formatINR(totals.shipping) : 'Complimentary'}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn btn--gold btn--block" onClick={close}>
              Checkout · {formatINR(totals.total)}
            </Link>
            <p className={styles.note}>Inclusive of all taxes</p>
            <ReserveNote payments className={styles.reserveNote} />
          </footer>
        )}
      </aside>
    </>
  )
}
