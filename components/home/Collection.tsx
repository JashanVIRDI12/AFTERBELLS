'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { fragrances } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'
import MediaSlot from '@/components/media/MediaSlot'
import HourDial from '@/components/ui/HourDial'
import ReserveButton from '@/components/ui/ReserveButton'
import EditionMeter from '@/components/ui/EditionMeter'
import styles from './Collection.module.css'
import ReserveNote from '@/components/ui/ReserveNote'


export default function Collection({ media }: { media: Record<string, ResolvedMedia> }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.card}`)
      cards.forEach((card, i) => {
        // reveal the whole chapter as it arrives (children stay pinned, so per-element reveals would never fire)
        ScrollTrigger.create({
          trigger: card,
          start: 'top 70%',
          once: true,
          onEnter: () => card.classList.add('is-in'),
        })
        if (prefersReducedMotion()) return
        // the bottle rises into place as its chapter slides up
        gsap.fromTo(
          card.querySelector(`.${styles.frame}`),
          { yPercent: 14, scale: 0.9 },
          {
            yPercent: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: card, start: 'top bottom', end: 'top top', scrub: true },
          },
        )
        const next = cards[i + 1]
        if (!next) return
        // the current chapter recedes as the next slides over it
        gsap.to(card.querySelector(`.${styles.inner}`), {
          scale: 0.9,
          yPercent: -4,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
        })
        gsap.to(card.querySelector(`.${styles.dim}`), {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="collection" className={styles.collection} aria-label="The collection" data-own-cta>
      <div className={`wrap ${styles.intro}`} data-header="light">
        <div className={styles.introHead}>
          <p className="t-eyebrow" data-reveal>
            The Collection
          </p>
          <h2 className={`t-title ${styles.introTitle}`} data-reveal style={{ '--d': '.08s' } as React.CSSProperties}>
            Choose your <span className="gold-text">hour.</span>
          </h2>
        </div>
        <div className={styles.introSide} data-reveal style={{ '--d': '.16s' } as React.CSSProperties}>
          <p className={styles.introCopy}>
            Dusk, dawn or midnight. Each is made once, in limited number.
          </p>
          <Link href="/collection" className="link">
            View the collection
          </Link>
        </div>
      </div>

      <div className={styles.stack}>
        {fragrances.map((f, i) => (
          <article
            key={f.slug}
            className={styles.card}
            data-header={f.theme.tone}
            style={
              {
                '--bg': f.theme.bg,
                '--bg2': f.theme.bg2,
                '--ink': f.theme.ink,
                '--accent': f.theme.accent,
                zIndex: i + 1,
              } as React.CSSProperties
            }
            aria-labelledby={`f-${f.slug}`}
          >
            <div className={styles.inner}>
              <div className={styles.meta} data-cr>
                <span className={styles.no}>No. {f.no}</span>
                <span className={styles.hour}>
                  <HourDial time={f.hour} />
                  <b>{f.hour}</b>
                </span>
              </div>

              <Link href={`/fragrances/${f.slug}`} className={styles.visual} aria-label={`Discover ${f.name}`}>
                <MediaSlot
                  media={media[`${f.slug}-cutout`]}
                  transparent
                  theme={f.theme}
                  label={f.label}
                  sizes="(min-width: 1024px) 34vw, 80vw"
                  className={styles.frame}
                />
              </Link>

              <div className={styles.text}>
                <h3 id={`f-${f.slug}`} className={`t-name ${styles.name}`} data-cr>
                  {f.name}
                </h3>
                <p className={styles.tagline} data-cr style={{ '--d': '.08s' } as React.CSSProperties}>
                  {f.tagline}
                </p>
                <p className={styles.family} data-cr style={{ '--d': '.12s' } as React.CSSProperties}>
                  {f.family}
                </p>
              </div>

              <div className={styles.side}>
                <p className={styles.keys} data-cr style={{ '--d': '.14s' } as React.CSSProperties}>
                  {f.keyNotes.join(' · ')}
                </p>
                <div data-cr style={{ '--d': '.18s' } as React.CSSProperties}>
                  <EditionMeter variantId={f.variants[0].id} compact quiet className={styles.meter} />
                </div>
                <div className={styles.buy} data-cr style={{ '--d': '.22s' } as React.CSSProperties}>
                  <p className={styles.price}>
                    {formatINR(f.variants[0].price)}
                    <small>{f.variants[0].size} · Inclusive of taxes</small>
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/fragrances/${f.slug}`} className={`link ${styles.discover}`}>
                      Discover
                    </Link>
                    <ReserveButton variantId={f.variants[0].id} className={styles.reserve} />
                  </div>
                </div>
                <div data-cr style={{ '--d': '.26s' } as React.CSSProperties}>
                  <ReserveNote />
                </div>
              </div>
            </div>
            <span className={styles.dim} aria-hidden />
          </article>
        ))}
      </div>
    </section>
  )
}
