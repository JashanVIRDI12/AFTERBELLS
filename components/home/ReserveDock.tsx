'use client'

import { useEffect, useState } from 'react'
import { fragrances } from '@/lib/catalog'
import { editionPrice } from '@/lib/pricing'
import { useUI } from '@/lib/stores'
import { site } from '@/lib/site'
import styles from './ReserveDock.module.css'

/**
 * Phone only: a slim shop bar that appears once the hero has gone, and steps aside while any
 * section with its own buy button ([data-own-cta]) or the footer is on screen, so a screen
 * never shows two gold buttons.
 */
export default function ReserveDock() {
  const [show, setShow] = useState(false)
  const overlay = useUI((s) => s.menuOpen || s.cartOpen)
  const size = fragrances[0]?.variants[0]?.size

  useEffect(() => {
    const hero = document.querySelector('main section')
    const blockers = [...document.querySelectorAll('[data-own-cta]'), document.querySelector('footer')].filter(
      (el): el is Element => Boolean(el),
    )
    const visible = new Map<Element, boolean>()
    const update = () => {
      const heroOn = hero ? visible.get(hero) !== false : true
      const block = blockers.some((el) => visible.get(el))
      setShow(!heroOn && !block)
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target, e.isIntersecting)
        update()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    for (const el of [hero, ...blockers]) if (el) io.observe(el)
    return () => io.disconnect()
  }, [])

  const on = show && !overlay

  return (
    <div className={`${styles.dock} ${on ? styles.on : ''}`} aria-hidden={!on} inert={!on}>
      <div className={styles.info}>
        <span className={styles.kicker}>First Edition · {editionPrice().label}</span>
        <span className={styles.count}>{size} · {site.delivery.fast}</span>
      </div>
      <a href="#collection" className={`btn btn--gold ${styles.btn}`}>
        Shop
      </a>
    </div>
  )
}
