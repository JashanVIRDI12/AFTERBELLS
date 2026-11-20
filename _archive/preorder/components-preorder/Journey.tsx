'use client'

import { useEffect, useRef } from 'react'
import { steps } from '@/lib/content'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import styles from './Journey.module.css'

/** Reserve → Composed → Sealed → Delivered: a gold line that draws itself, lighting each step as it passes. */
export default function Journey() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const list = el.querySelector(`.${styles.list}`)
      gsap.fromTo(
        `.${styles.fill}`,
        { scale: 0 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } },
      )
      gsap.utils.toArray<HTMLElement>(`.${styles.step}`).forEach((s) => {
        ScrollTriggerOnce(s, () => s.classList.add(styles.lit))
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className={styles.section} data-header="dark" aria-labelledby="journey-h">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>
            How it works
          </p>
          <h2 id="journey-h" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            From reservation <span className="gold-text">to your door.</span>
          </h2>
        </header>
        <div className={styles.track}>
          <span className={styles.line} aria-hidden>
            <span className={styles.fill} />
          </span>
          <ol className={styles.list}>
            {steps.map((s) => (
              <li key={s.no} className={styles.step}>
                <span className={styles.node} aria-hidden>
                  <i />
                </span>
                <span className={styles.no}>{s.no}</span>
                <h3 className={styles.name}>{s.title}</h3>
                <p className={styles.body}>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** light a step once it reaches the middle of the screen */
function ScrollTriggerOnce(el: HTMLElement, onEnter: () => void) {
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 62%', once: true, onEnter } })
}
