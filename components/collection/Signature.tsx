'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { ResolvedMedia } from '@/lib/media'
import { signature } from '@/lib/catalog'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import GoldFlakes from '@/components/brand/GoldFlakes'
import { site } from '@/lib/site'
import { vials } from '@/lib/content'
import styles from './Signature.module.css'

/* small engraved marks, drawn in a single gold line */
const icons = {
  gift: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="9" y="19" width="30" height="21" />
      <rect x="6.5" y="13.5" width="35" height="5.5" />
      <path d="M24 13.5V40M24 13.5c-2.5-5.5-9.5-7-10-2.5-.4 3.4 6 2.5 10 2.5zm0 0c2.5-5.5 9.5-7 10-2.5.4 3.4-6 2.5-10 2.5z" />
    </svg>
  ),
  seal: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="6" y="12" width="36" height="25" />
      <path d="M6 12l18 14 18-14" />
      <circle cx="24" cy="28.5" r="5.5" />
      <path d="M21.6 28.5h4.8M24 26.1v4.8" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M8 35h32M10 35a14 14 0 0 1 28 0" />
      <path d="M24 21v-3M21 18h6M5 39h38" />
    </svg>
  ),
}

const strength = parseInt(signature.strength, 10) || 20

/** In every bottle, with every order — a wall of glass tiles over the gold. */
export default function Signature({ media }: { media: ResolvedMedia }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = prefersReducedMotion()

    // light on the glass follows the pointer
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(`.${styles.tile}`)
      if (!tile || raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = tile.getBoundingClientRect()
        tile.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        tile.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      })
    }
    el.addEventListener('pointermove', onMove)

    const ctx = gsap.context(() => {
      if (reduced) return
      const tiles = gsap.utils.toArray<HTMLElement>(`.${styles.tile}`)
      gsap.fromTo(
        tiles,
        { y: 48, opacity: 0, filter: 'blur(10px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.09,
          clearProps: 'filter',
          scrollTrigger: { trigger: `.${styles.bento}`, start: 'top 78%', once: true },
        },
      )
      // the figures count up as their tiles arrive
      el.querySelectorAll<HTMLElement>('[data-count]').forEach((n) => {
        const to = Number(n.dataset.count)
        const obj = { v: 0 }
        n.textContent = '0'
        gsap.to(obj, {
          v: to,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => {
            n.textContent = String(Math.round(obj.v))
          },
          scrollTrigger: { trigger: n, start: 'top 85%', once: true },
        })
      })
      gsap.fromTo(
        `.${styles.backdropImg}`,
        { yPercent: -8, scale: 1.15 },
        { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
      gsap.fromTo(
        `.${styles.head} > *`,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 72%', once: true } },
      )
    }, el)

    return () => {
      el.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={root} className={styles.section} data-header="dark" aria-labelledby="sig-title">
      <div className={styles.backdrop} aria-hidden>
        {media.src && <Image src={media.src} alt="" fill sizes="100vw" quality={70} className={styles.backdropImg} />}
        <span className={styles.veil} />
      </div>
      <GoldFlakes className={styles.flakes} density={1.6} size={6} speed={0.7} />

      <div className={`wrap ${styles.layout}`}>
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.kicker}`}>The house standard</p>
          <h2 id="sig-title" className={`t-title ${styles.title}`}>
            In every bottle.
            <br />
            <span className="gold-text">With every order.</span>
          </h2>
          <p className={styles.lede}>What goes inside each bottle, and what comes with it.</p>
          <p className={styles.close}>{site.delivery.fast}</p>
          <a href="#fragrances" className={`btn btn--gold ${styles.cta}`}>
            Choose your hour
          </a>
        </header>

        <ul className={styles.bento}>
          <li className={`${styles.tile} ${styles.gold}`}>
            {media.src && (
              <Image src={media.src} alt={media.alt} fill sizes="(min-width: 1000px) 34vw, 92vw" quality={85} className={styles.tileImg} />
            )}
            <span className={styles.tileShade} aria-hidden />
            <div className={styles.tileBody}>
              <span className={`${styles.figure} gold-text`}>
                <span data-count="24">24</span>K
              </span>
              <h3 className={styles.label}>Gold flakes</h3>
              <p className={styles.desc}>Suspended in every bottle. Turn it and they rise.</p>
            </div>
          </li>
          <li className={`${styles.tile} ${styles.oil}`}>
            <div className={styles.tileBody}>
              <span className={`${styles.figure} ${styles.figureSm} gold-text`}>
                <span data-count={strength}>{strength}</span>%
              </span>
              <h3 className={styles.label}>Perfume oil</h3>
              <p className={styles.desc}>A rich concentration, made to stay on skin.</p>
            </div>
          </li>
          <li className={`${styles.tile} ${styles.vials}`}>
            <div className={styles.tileBody}>
              <span className={styles.icon}>{icons.gift}</span>
              <h3 className={styles.name}>{vials.title}</h3>
              <p className={styles.desc}>{vials.body}</p>
            </div>
          </li>
          <li className={`${styles.tile} ${styles.delivery}`}>
            <div className={styles.tileBody}>
              <span className={styles.icon}>{icons.seal}</span>
              <h3 className={styles.name}>Delivered with our compliments</h3>
              <p className={styles.desc}>Insured, tracked delivery to your door across India, at no charge.</p>
            </div>
          </li>
          <li className={`${styles.tile} ${styles.concierge}`}>
            <div className={styles.tileBody}>
              <span className={styles.icon}>{icons.bell}</span>
              <h3 className={styles.name}>Your concierge</h3>
              <p className={styles.desc}>A member of the house answers every message, before your order and after.</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}
