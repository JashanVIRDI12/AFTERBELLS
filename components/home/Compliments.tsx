'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { compliments } from '@/lib/content'
import type { ResolvedMedia } from '@/lib/media'
import { site } from '@/lib/site'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import Corners from '@/components/ui/Corners'
import ConciergeButton, { ConciergeCaption } from '@/components/ui/ConciergeButton'
import { Emblem } from '@/components/brand/Brand'
import styles from './Compliments.module.css'

/** What travels with every order, set like an engraved card on frosted glass. */
export default function Compliments({ backdrop }: { backdrop?: ResolvedMedia }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // the photograph drifts slowly behind the glass
      gsap.fromTo(
        `.${styles.backdropImg}`,
        { yPercent: -6, scale: 1.12 },
        { yPercent: 6, scale: 1.04, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
      // the card's rules draw outward from the centre
      gsap.fromTo(
        `.${styles.rule}`,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, ease: 'expo.inOut', stagger: 0.12, scrollTrigger: { trigger: `.${styles.card}`, start: 'top 75%', once: true } },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="compliments" className={styles.section} data-header="dark" aria-labelledby="compliments-title" data-own-cta>
      <div className={styles.backdrop} aria-hidden>
        {backdrop?.src && <Image src={backdrop.src} alt="" fill sizes="100vw" quality={75} className={styles.backdropImg} />}
        <span className={styles.veil} />
      </div>

      <div className={`wrap ${styles.stage}`}>
        <div className={`${styles.card} glass heritage`} data-reveal>
          <Corners />
          <Emblem className={styles.emblem} />
          <h2 id="compliments-title" className={`t-title ${styles.title}`}>
            With our <span className="gold-text">compliments.</span>
          </h2>

          <ul className={styles.perks} aria-label="With every order">
            {compliments.map((c) => (
              <li key={c.key}>
                <span className={styles.perkTitle}>{c.title}</span>
                <span className={styles.perkBody}>{c.body}</span>
              </li>
            ))}
          </ul>

          <div className={styles.ornament} aria-hidden>
            <span className={styles.rule} />
            <i />
            <span className={styles.rule} />
          </div>

          <p className={styles.copy}>
            {site.delivery.fast}.
            <br />
            {site.delivery.standard}.
          </p>

          <div className={styles.ctas}>
            <a href="#collection" className="btn btn--gold">
              Choose your hour
            </a>
            <ConciergeButton caption={false} />
          </div>
          <ConciergeCaption className={styles.callLine} />
        </div>
      </div>
    </section>
  )
}
