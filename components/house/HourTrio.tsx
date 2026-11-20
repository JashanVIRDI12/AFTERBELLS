'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { fragrances } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import MediaSlot from '@/components/media/MediaSlot'
import styles from './HourTrio.module.css'

const HOURS: Record<string, string> = { 'amber-hour': 'Dusk', 'open-sky': 'Dawn', 'iron-crown': 'Midnight' }

/** The idea of the house: three hours, three bottles standing on glass. */
export default function HourTrio({ media }: { media: Record<string, ResolvedMedia> }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // each bottle drifts at its own pace, as if hung at different depths
      gsap.utils.toArray<HTMLElement>(`.${styles.bottle}`).forEach((b, i) => {
        gsap.fromTo(
          b,
          { yPercent: 10 + i * 6 },
          { yPercent: -6 - i * 3, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      })
      gsap.fromTo(
        `.${styles.tile}`,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: `.${styles.grid}`, start: 'top 80%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className={styles.trio} data-header="dark" aria-labelledby="trio-h">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>
            The First Edition
          </p>
          <h2 id="trio-h" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            Three hours. <span className="gold-text">One instinct.</span>
          </h2>
          <p className={styles.lede} data-reveal style={{ '--d': '.12s' } as React.CSSProperties}>
            Dusk, dawn and midnight, expressed through warmth, clarity and depth. Follow the mood that feels like you.
          </p>
        </header>

        <ul className={styles.grid}>
          {fragrances.map((f) => (
            <li key={f.slug}>
              <Link
                href={`/fragrances/${f.slug}`}
                className={styles.tile}
                style={{ '--accent': f.theme.accent, '--bg2': f.theme.bg2 } as React.CSSProperties}
              >
                <span className={styles.glow} aria-hidden />
                <div className={styles.bottle}>
                  <MediaSlot
                    media={media[`${f.slug}-cutout`]}
                    transparent
                    reveal={false}
                    theme={f.theme}
                    label={f.label}
                    className={styles.cut}
                    sizes="(min-width: 900px) 22vw, 60vw"
                  />
                </div>
                <span className={styles.meta}>
                  <span className={styles.hour}>{HOURS[f.slug]}</span>
                  <span className={`t-name ${styles.name}`}>{f.name}</span>
                  <span className={styles.family}>{f.family}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
