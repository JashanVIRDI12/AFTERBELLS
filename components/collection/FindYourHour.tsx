'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { fragrances } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import MediaSlot from '@/components/media/MediaSlot'
import ReserveButton from '@/components/ui/ReserveButton'
import styles from './FindYourHour.module.css'
import ConciergeButton from '@/components/ui/ConciergeButton'
import ReserveNote from '@/components/ui/ReserveNote'

const HOURS: Record<string, { no: string; label: string }> = {
  'amber-hour': { no: 'I', label: 'Dusk' },
  'open-sky': { no: 'II', label: 'Dawn' },
  'iron-crown': { no: 'III', label: 'Midnight' },
}

/** Choose by feeling: three engraved tabs, one hour shown at a time. */
export default function FindYourHour({ media }: { media: Record<string, ResolvedMedia> }) {
  const [active, setActive] = useState(0)
  const panels = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const first = useRef(true)
  const pick = (f: (typeof fragrances)[number], label: string) => f.wear.find((w) => w.label === label)?.value ?? ''

  // the new hour arrives: photograph unveils upward, the words follow
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = panels.current?.querySelector<HTMLElement>(`[data-panel="${active}"]`)
    if (!el || prefersReducedMotion()) return
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    tl.fromTo(el.querySelector(`.${styles.mat}`), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.1 })
      .fromTo(el.querySelectorAll('[data-in]'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06 }, 0.15)
    return () => {
      tl.kill()
    }
  }, [active])

  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (active + dir + fragrances.length) % fragrances.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <section id="find-your-hour" className={styles.section} data-header="light" aria-labelledby="fyh-title">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.eyebrow}`} data-reveal>
            Find your hour
          </p>
          <h2 id="fyh-title" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            Which one is <span className="gold-text">yours?</span>
          </h2>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Choose an hour" onKeyDown={onKey} data-reveal>
          {fragrances.map((f, i) => {
            const h = HOURS[f.slug]
            const on = i === active
            return (
              <button
                key={f.slug}
                ref={(b) => {
                  tabs.current[i] = b
                }}
                role="tab"
                id={`fyh-tab-${f.slug}`}
                aria-selected={on}
                aria-controls={`fyh-panel-${f.slug}`}
                tabIndex={on ? 0 : -1}
                className={`${styles.tab} ${on ? styles.on : ''}`}
                onClick={() => setActive(i)}
              >
                <span className={styles.tabNo}>{h.no}</span>
                <span className={styles.tabLabel}>{h.label}</span>
              </button>
            )
          })}
        </div>

        <div ref={panels} className={styles.panels}>
          {fragrances.map((f, i) => {
            const on = i === active
            return (
              <div
                key={f.slug}
                data-panel={i}
                role="tabpanel"
                id={`fyh-panel-${f.slug}`}
                aria-labelledby={`fyh-tab-${f.slug}`}
                className={`${styles.panel} ${on ? styles.shown : ''}`}
                aria-hidden={!on}
                inert={!on}
                style={{ '--accent': f.theme.accent } as React.CSSProperties}
              >
                <div className={styles.mat}>
                  <MediaSlot
                    media={media[`${f.slug}-mood`]}
                    theme={f.theme}
                    reveal={false}
                    className={styles.photo}
                    sizes="(min-width: 900px) 36vw, 88vw"
                  />
                </div>
                <div className={styles.copy}>
                  <p className={`t-name ${styles.name}`} data-in>
                    {f.name}
                  </p>
                  <p className={`t-title ${styles.mood}`} data-in>
                    {pick(f, 'Mood')}.
                  </p>
                  <div className={styles.ornament} aria-hidden data-in>
                    <span />
                    <i />
                    <span />
                  </div>
                  <dl className={styles.facts} data-in>
                    <div>
                      <dt>Notes</dt>
                      <dd>{f.keyNotes.join(' · ')}</dd>
                    </div>
                    <div>
                      <dt>Wear it</dt>
                      <dd>{pick(f, 'Moment')}</dd>
                    </div>
                    <div>
                      <dt>Season</dt>
                      <dd>{pick(f, 'Season')}</dd>
                    </div>
                  </dl>
                  <div className={styles.actions} data-in>
                    <ReserveButton variantId={f.variants[0].id} price={f.variants[0].price} className={styles.reserve} />
                    <Link href={`/fragrances/${f.slug}`} className="link">
                      Discover {f.name}
                    </Link>
                  </div>
                  <ReserveNote />
                  <ConciergeButton variant="link" about={f.name} />
                  <p className={styles.price} data-in>
                    {f.variants[0].size} · Inclusive of all taxes
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
