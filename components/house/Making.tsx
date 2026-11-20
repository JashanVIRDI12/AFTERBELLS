'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ResolvedMedia } from '@/lib/media'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'
import styles from './Making.module.css'

export type Step = { no: string; title: string; body: string; media: ResolvedMedia }

/**
 * How a bottle is made, told like a monograph: one photograph holds its place while four chapters
 * pass beside it; as each arrives, its photograph is drawn up over the last.
 */
export default function Making({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(`.${styles.chapter}`).forEach((c, i) => {
        ScrollTrigger.create({
          trigger: c,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(i),
          // scrolling back above the first chapter returns to the first photograph
          ...(i === 0 ? { onLeaveBack: () => setActive(0) } : {}),
        })
      })
      if (prefersReducedMotion()) return
      // the progress rule fills as the chapters are read
      gsap.fromTo(
        `.${styles.progressFill}`,
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: `.${styles.chapters}`, start: 'top 55%', end: 'bottom 55%', scrub: 0.5 } },
      )
      // phone: each chapter's own photograph unveils as it arrives
      gsap.utils.toArray<HTMLElement>(`.${styles.inline}`).forEach((m) => {
        gsap.fromTo(
          m,
          { clipPath: 'inset(18% 8% 18% 8%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 95%', end: 'top 45%', scrub: true } },
        )
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className={styles.making} data-header="dark" aria-labelledby="making-h">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>
            The making
          </p>
          <h2 id="making-h" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            Character, in <span className="gold-text">every detail.</span>
          </h2>
          <p className={styles.lede} data-reveal style={{ '--d': '.12s' } as React.CSSProperties}>
            From the first material to the finishing touch.
          </p>
        </header>

        <div className={styles.stage}>
          {/* desktop: the photograph that holds its place */}
          <div className={styles.plate} aria-hidden>
            <div className={styles.frame}>
              {steps.map((s, i) =>
                s.media.src ? (
                  <div key={s.no} className={`${styles.shot} ${i <= active ? styles.shown : ''}`} style={{ zIndex: i + 1 }}>
                    <Image src={s.media.src} alt="" fill sizes="(min-width: 1000px) 512px, 1px" quality={92} className={styles.img} />
                  </div>
                ) : null,
              )}
            </div>
          </div>

          <div className={styles.chaptersWrap}>
            <span className={styles.progress} aria-hidden>
              <span className={styles.progressFill} />
            </span>
            <ol className={styles.chapters}>
              {steps.map((s, i) => (
                <li key={s.no} className={`${styles.chapter} ${i === active ? styles.current : ''}`}>
                  {s.media.src && (
                    <div className={styles.inline}>
                      <Image src={s.media.src} alt={s.media.alt} fill sizes="(min-width: 560px) 512px, 92vw" quality={85} className={styles.img} />
                    </div>
                  )}
                  <span className={styles.node} aria-hidden />
                  <span className={`${styles.numeral} gold-text`}>{s.no}</span>
                  <h3 className={styles.chapterTitle}>{s.title}</h3>
                  <span className={styles.rule} aria-hidden />
                  <p className={styles.body}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
