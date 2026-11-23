'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { useUI } from '@/lib/stores'
import { Emblem, Wordmark } from '@/components/brand/Brand'
import styles from './Preloader.module.css'

/**
 * First visit of a session, landing on the home page: the peacock fans its tail open in gold,
 * the wordmark rises, then the curtain lifts. Skipped (via an inline <head> script) on any other
 * landing page, on return visits within the session and for reduced motion.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const set = useUI((s) => s.set)

  useEffect(() => {
    const el = root.current
    const html = document.documentElement
    if (!el || html.classList.contains('ab-skip-intro')) {
      set({ ready: true })
      return
    }
    try {
      sessionStorage.setItem('ab-intro', '1')
    } catch {}

    const q = gsap.utils.selector(el)
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    // about 1.7 s in all: long enough to be the house's signature, short enough not to cost a visitor
    tl.set(q(`.${styles.fan}`), { '--fan': '0deg' })
      .to(q(`.${styles.fan}`), { '--fan': '360deg', duration: 1.05, ease: 'power2.inOut' }, 0.05)
      .fromTo(q(`.${styles.glow}`), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.2 }, 0.05)
      .fromTo(q(`.${styles.word} svg`), { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.8 }, 0.45)
      .fromTo(q(`.${styles.tag}`), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7 }, 0.65)
      .call(() => set({ ready: true }), [], 1.3)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' }, 1.1)
      .to(q(`.${styles.stage}`), { yPercent: -18, opacity: 0, duration: 0.6, ease: 'power3.in' }, 1.05)
      .set(el, { display: 'none' })

    return () => {
      tl.kill()
    }
  }, [set])

  return (
    <div ref={root} className={styles.loader} aria-hidden>
      <div className={styles.stage}>
        <span className={styles.glow} />
        <span className={styles.fan}>
          <Emblem className={styles.emblem} shine />
        </span>
        <span className={styles.word}>
          <Wordmark />
        </span>
        <span className={`t-eyebrow lockup ${styles.tag}`}>Reserved for the exceptional</span>
      </div>
    </div>
  )
}
