'use client'

import { useEffect, useRef } from 'react'
import { privileges } from '@/lib/content'
import { site } from '@/lib/site'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import Corners from '@/components/ui/Corners'
import styles from './Privileges.module.css'

/* engraved marks, one line of gold each */
const marks: Record<string, React.ReactNode> = {
  // a key: first through the door to the next edition
  first: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="16" cy="24" r="8" />
      <circle cx="16" cy="24" r="3" />
      <path d="M24 24h18M35 24v6M40 24v4" />
    </svg>
  ),
  // a small flacon with a square cap
  gift: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="19" y="7" width="10" height="8" />
      <path d="M21 15v3h6v-3M14 22a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v18H14z" />
      <rect x="19" y="26" width="10" height="8" />
    </svg>
  ),
  // the concierge's bell
  concierge: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M8 35h32M10 35a14 14 0 0 1 28 0" />
      <path d="M24 21v-3M21 18h6M5 39h38" />
    </svg>
  ),
}

/** The three privileges of reserving early, presented like engraved certificates. */
export default function Privileges() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.card}`,
        { y: 70, opacity: 0, rotateX: 8 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1.4,
          ease: 'expo.out',
          stagger: 0.14,
          scrollTrigger: { trigger: `.${styles.grid}`, start: 'top 80%', once: true },
        },
      )
      gsap.fromTo(
        `.${styles.mark}`,
        { scale: 0.6, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: 'back.out(1.6)',
          stagger: 0.14,
          delay: 0.25,
          scrollTrigger: { trigger: `.${styles.grid}`, start: 'top 80%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className={styles.section} data-header="light" aria-labelledby="priv-h">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>
            The privileges of a preorder
          </p>
          <h2 id="priv-h" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            Reserved early, <span className="gold-text">invited first.</span>
          </h2>
          <p className={styles.lede} data-reveal style={{ '--d': '.12s' } as React.CSSProperties}>
            For guests who reserve the {site.preorder.edition} before it is made.
          </p>
        </header>
        <ul className={styles.grid}>
          {privileges.map((p) => (
            <li key={p.key} className={`${styles.card} heritage`}>
              <Corners />
              <span className={styles.no}>{p.no}</span>
              <span className={styles.mark}>{marks[p.key]}</span>
              <h3 className={styles.name}>{p.title}</h3>
              <span className={styles.rule} aria-hidden />
              <p className={styles.body}>{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
