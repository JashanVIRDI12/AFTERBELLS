'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { ResolvedMedia } from '@/lib/media'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import styles from './PageHero.module.css'

type Props = {
  eyebrow: string
  title: React.ReactNode
  lede?: React.ReactNode
  /** Full-bleed photograph behind the title; without one the head is set on ivory */
  media?: ResolvedMedia
  /** Keep a carefully framed product photograph still while the opening copy animates. */
  mediaMotion?: boolean
  /** 'tall' for chapter openers, 'short' when the content should arrive quickly (shop pages) */
  size?: 'tall' | 'short'
  children?: React.ReactNode
}

/** Opening of an inner page: eyebrow, title, one line — over a photograph or on paper. */
export default function PageHero({ eyebrow, title, lede, media, mediaMotion = true, size = 'tall', children }: Props) {
  const root = useRef<HTMLElement>(null)
  const dark = Boolean(media?.src)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      if (dark && mediaMotion) tl.fromTo(q(`.${styles.img}`), { scale: 1.12 }, { scale: 1, duration: 2.6 }, 0)
      tl.fromTo(q('[data-ph-line]'), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.5, stagger: 0.1 }, 0.1).fromTo(
        q('[data-ph-fade]'),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 },
        0.45,
      )
      if (dark && mediaMotion)
        gsap.to(q(`.${styles.media}`), {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        })
    }, el)
    return () => ctx.revert()
  }, [dark, mediaMotion])

  return (
    <section
      ref={root}
      className={`${styles.hero} ${dark ? styles.dark : styles.paper} ${size === 'short' ? styles.short : ''}`}
      data-header={dark ? 'dark' : 'light'}
      data-media-slot={media?.slot}
    >
      {dark && media?.src && (
        <div className={styles.media} aria-hidden>
          <Image src={media.src} alt="" fill sizes="100vw" preload quality={85} className={styles.img} />
          <span className={styles.shade} />
        </div>
      )}
      <div className={`wrap ${styles.content}`}>
        <p className={`t-eyebrow ${styles.eyebrow}`} data-ph-fade>
          {eyebrow}
        </p>
        <h1 className={`t-title ${styles.title}`}>
          <span className="mask">
            <span data-ph-line>{title}</span>
          </span>
        </h1>
        {lede && (
          <p className={styles.lede} data-ph-fade>
            {lede}
          </p>
        )}
        {children && <div data-ph-fade>{children}</div>}
      </div>
    </section>
  )
}
