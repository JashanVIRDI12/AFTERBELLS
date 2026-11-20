'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ResolvedMedia } from '@/lib/media'
import { privileges } from '@/lib/content'
import { site } from '@/lib/site'
import { dateInWords } from '@/lib/words'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import Countdown from '@/components/ui/Countdown'
import Corners from '@/components/ui/Corners'
import ConciergeButton, { ConciergeCaption } from '@/components/ui/ConciergeButton'
import { Emblem } from '@/components/brand/Brand'
import styles from './PreorderHero.module.css'

/** The preorder page opens as an invitation on glass, over the three bottles. */
export default function PreorderHero({ backdrop }: { backdrop: ResolvedMedia }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(q(`.${styles.img}`), { scale: 1.16 }, { scale: 1.04, duration: 2.8 }, 0)
        .fromTo(q(`.${styles.card}`), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, 0.15)
        .fromTo(q('[data-in]'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07 }, 0.45)
        .fromTo(q(`.${styles.rule}`), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', stagger: 0.1 }, 0.7)
      gsap.to(q(`.${styles.media}`), {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className={styles.hero} data-header="dark" aria-labelledby="po-h">
      <div className={styles.media} aria-hidden>
        {backdrop.src && <Image src={backdrop.src} alt="" fill sizes="100vw" preload quality={75} className={styles.img} />}
        <span className={styles.veil} />
      </div>

      <div className="wrap">
        <div className={`${styles.card} glass heritage`}>
          <Corners />
          <Emblem className={styles.emblem} />
          <p className={`t-eyebrow ${styles.kicker}`} data-in>
            The {site.preorder.edition} · Preorder
          </p>
          <h1 id="po-h" className={`t-title ${styles.title}`} data-in>
            Reserved before it <span className="gold-text">exists.</span>
          </h1>
          <p className={styles.lede} data-in>
            Reserve now and your bottle is made for you, sealed in gold, and among the first to leave the house.
          </p>

          <ul className={styles.perks} data-in>
            {privileges.map((p) => (
              <li key={p.key}>{p.title}</li>
            ))}
          </ul>

          <div className={styles.ornament} aria-hidden>
            <span className={styles.rule} />
            <i />
            <span className={styles.rule} />
          </div>

          <div className={styles.clock} data-in>
            <p className={styles.small}>Preorders close on {dateInWords(site.preorder.closesLabel, false)}</p>
            <Countdown large className={styles.count} />
          </div>

          <div className={styles.ctas} data-in>
            <Link href="/collection" className="btn btn--gold">
              Choose your hour
            </Link>
            <ConciergeButton caption={false} />
          </div>
          <ConciergeCaption className={styles.callLine} />
        </div>
      </div>
    </section>
  )
}
