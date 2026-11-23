'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useDialogFocus } from '@/lib/useDialogFocus'
import { useCart, useUI } from '@/lib/stores'
import { isKnown } from '@/lib/leads'
import { track } from '@/lib/track'
import Finder, { savedHour } from '@/components/finder/Finder'
import { FINDER_USED } from '@/lib/finder'
import styles from './Popup.module.css'

/** Pages where the house never interrupts. */
const QUIET = ['/checkout', '/admin', '/account', '/order', '/feedback', '/policies']
/** After "No thank you", stay quiet this long. */
const REST_MS = 7 * 24 * 3600 * 1000
const DISMISSED = 'ab-popup'
const SHOWN = 'ab-popup-s'
const PAGES = 'ab-pages'

const get = (s: Storage, k: string) => {
  try {
    return s.getItem(k)
  } catch {
    return null
  }
}
const put = (s: Storage, k: string, v: string) => {
  try {
    s.setItem(k, v)
  } catch {}
}

/**
 * The one pop-up: "Not sure which to choose?" → the three-question finder.
 * Shown at most once a session and never again for a week after "No thank you". It waits until the
 * guest is browsing (a second page and a few seconds, or a long first look, or leaving the window on
 * a computer), and never appears with something in the bag, over a form, or once they have left their details.
 */
export default function LeadPopup() {
  const path = usePathname()
  const ready = useUI((s) => s.ready)
  const hydrated = useUI((s) => s.hydrated)
  const [open, setOpen] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)

  const close = (dismissed: boolean) => {
    setOpen(false)
    if (dismissed) put(localStorage, DISMISSED, String(Date.now()))
  }
  useDialogFocus(open, sheet, () => close(true))

  // count pages seen this session (once per page, even when effects run twice in development)
  const counted = useRef('')
  useEffect(() => {
    if (counted.current === path) return
    counted.current = path
    put(sessionStorage, PAGES, String(Number(get(sessionStorage, PAGES) ?? 0) + 1))
  }, [path])

  useEffect(() => {
    if (!ready || !hydrated || open) return
    if (QUIET.some((q) => path.startsWith(q))) return
    const rested = Date.now() - Number(get(localStorage, DISMISSED) ?? 0) > REST_MS
    if (!rested || get(sessionStorage, SHOWN) || isKnown() || savedHour()) return

    const blocked = () => {
      const ui = useUI.getState()
      const a = document.activeElement
      return (
        useCart.getState().lines.length > 0 ||
        ui.cartOpen ||
        ui.menuOpen ||
        document.querySelector('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])') !== null ||
        (a instanceof HTMLElement && a.matches('input, textarea, select'))
      )
    }
    const show = () => {
      // never over the finder already in use on the page
      if (blocked() || get(sessionStorage, SHOWN) || get(sessionStorage, FINDER_USED) || savedHour()) return false
      put(sessionStorage, SHOWN, '1')
      setOpen(true)
      track('popup_view')
      return true
    }

    const pages = Number(get(sessionStorage, PAGES) ?? 1)
    const product = path.startsWith('/fragrances/') || path.startsWith('/gift-set')
    // a second page: 8 seconds in. First page: a longer look. Product pages: leave them to decide.
    const wait = pages >= 2 ? (product ? 30_000 : 8_000) : product ? 45_000 : 30_000
    let timer = window.setTimeout(function attempt() {
      if (!show()) timer = window.setTimeout(attempt, 10_000)
    }, wait)

    // on a computer, the pointer leaving through the top of the window
    const since = Date.now()
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 0 || Date.now() - since < 5_000) return
      if (show()) window.clearTimeout(timer)
    }
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    if (fine) document.documentElement.addEventListener('mouseout', onLeave)
    return () => {
      window.clearTimeout(timer)
      if (fine) document.documentElement.removeEventListener('mouseout', onLeave)
    }
  }, [path, ready, hydrated, open])

  if (!open) return null
  return (
    <div className={styles.wrap}>
      <div className={styles.scrim} onClick={() => close(true)} aria-hidden />
      <div ref={sheet} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="popup-finder-title" tabIndex={-1}>
        <button type="button" className={styles.close} onClick={() => close(true)} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <div className={styles.body}>
          <Finder mode="dialog" titleId="popup-finder-title" onAdded={() => close(false)} onDismiss={() => close(true)} />
        </div>
      </div>
    </div>
  )
}
