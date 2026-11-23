'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getVariant } from '@/lib/catalog'
import { useCart, useUI } from '@/lib/stores'
import { track } from '@/lib/track'
import styles from './BagReminder.module.css'

const SEEN = 'ab-bag-seen'

/** A returning guest with something in their bag is reminded once per visit, quietly, while browsing. */
export default function BagReminder() {
  const path = usePathname()
  const hydrated = useUI((s) => s.hydrated)
  const ready = useUI((s) => s.ready)
  const lines = useCart((s) => s.lines)
  const setUI = useUI((s) => s.set)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // never over a buy button: product pages, checkout and orders have their own way to the bag
    const quiet = ['/checkout', '/admin', '/order', '/fragrances/', '/gift-set', '/account']
    if (!hydrated || !ready || !lines.length || quiet.some((q) => path.startsWith(q))) return
    try {
      if (sessionStorage.getItem(SEEN)) return
      sessionStorage.setItem(SEEN, '1')
    } catch {
      return
    }
    // only for a visit that began with a full bag (not one filled a moment ago)
    const t = window.setTimeout(() => {
      setShow(true)
      track('bag_reminder')
    }, 1800)
    const hide = window.setTimeout(() => setShow(false), 11_000)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(hide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ready])

  if (!show || !lines.length) return null
  const first = getVariant(lines[0].variantId)?.product.name ?? 'Your selection'
  const more = lines.length - 1
  return (
    <div className={styles.toast} role="status">
      <p>
        <span className={styles.eyebrow}>Your bag is saved</span>
        {first}
        {more > 0 ? ` and ${more} more` : ''}
      </p>
      <button
        type="button"
        className={styles.view}
        onClick={() => {
          setShow(false)
          setUI({ cartOpen: true })
        }}
      >
        View bag
      </button>
      <button type="button" className={styles.x} onClick={() => setShow(false)} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  )
}
