'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Fragrance } from '@/lib/catalog'
import { signature } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import MediaSlot from '@/components/media/MediaSlot'
import ReserveButton from '@/components/ui/ReserveButton'
import EditionMeter from '@/components/ui/EditionMeter'
import { track } from '@/lib/track'
import styles from './ProductHero.module.css'
import ConciergeButton from '@/components/ui/ConciergeButton'
import ReserveNote from '@/components/ui/ReserveNote'
import ProductDetails from './ProductDetails'
import { vials } from '@/lib/content'
import { site } from '@/lib/site'

export default function ProductHero({ product: f, media }: { product: Fragrance; media: ResolvedMedia[] }) {
  const v = f.variants[0]
  const gallery = useRef<HTMLDivElement>(null)
  const cta = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const [showBar, setShowBar] = useState(false)

  useEffect(() => {
    track('product_view', { slug: f.slug })
  }, [f.slug])

  // Mobile sticky bar appears once the main CTA has scrolled away, and steps aside while
  // another buy block ([data-own-cta]) is on screen, so two gold buttons never show at once.
  useEffect(() => {
    const el = cta.current
    if (!el) return
    const others = [...document.querySelectorAll('[data-own-cta]')]
    let passed = false
    const seen = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === el) passed = !e.isIntersecting && e.boundingClientRect.top < 0
        else if (e.isIntersecting) seen.add(e.target)
        else seen.delete(e.target)
      }
      setShowBar(passed && seen.size === 0)
    })
    io.observe(el)
    for (const o of others) io.observe(o)
    return () => io.disconnect()
  }, [])

  const onGalleryScroll = () => {
    const g = gallery.current
    if (!g) return
    setSlide(Math.round(g.scrollLeft / g.clientWidth))
  }

  const goTo = (i: number) => {
    const g = gallery.current
    if (!g) return
    g.scrollTo({ left: i * g.clientWidth, behavior: 'smooth' })
  }

  const vars = {
    '--bg': f.theme.bg,
    '--bg2': f.theme.bg2,
    '--ink': f.theme.ink,
    '--accent': f.theme.accent,
  } as React.CSSProperties

  return (
    <section className={styles.hero} style={vars} data-header={f.theme.tone} aria-labelledby="p-name">
      <div className={styles.grid}>
        <div className={styles.galleryCol}>
          <div ref={gallery} className={styles.gallery} onScroll={onGalleryScroll} aria-label={`${f.name} images`}>
            {media.map((m, i) => (
              <div key={m.slot} className={styles.slide}>
                <MediaSlot
                  media={m}
                  theme={f.theme}
                  label={i === 0 ? f.label : undefined}
                  priority={i === 0}
                  reveal={i === 0 ? false : 'focus'}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className={styles.frame}
                  hintAt="top"
                />
              </div>
            ))}
          </div>
          <div className={styles.dots} role="group" aria-label="Choose image">
            {media.map((m, i) => (
              <button
                key={m.slot}
                aria-pressed={slide === i}
                aria-label={`Show image ${i + 1} of ${media.length}${m.alt ? `: ${m.alt}` : ''}`}
                className={slide === i ? styles.dotOn : ''}
                onClick={() => goTo(i)}
              />
            ))}
            <span className={styles.counter}>
              {slide + 1} / {media.length}
            </span>
          </div>
        </div>

        <div className={styles.panelCol}>
          <div className={styles.panel}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/collection">Collection</Link>
              <span aria-hidden>/</span>
              <span aria-current="page">{f.name}</span>
            </nav>

            <p className={styles.eyebrow}>
              <span className={styles.no}>No. {f.no}</span>
            </p>

            <h1 id="p-name" className={`t-name ${styles.name}`}>
              {f.name}
            </h1>

            {/* what is in the bottle, set like the plate on a case */}
            <dl className={styles.spec}>
              <div>
                <dt>Concentration</dt>
                <dd>{f.concentration}</dd>
              </div>
              <div>
                <dt>Perfume oil</dt>
                <dd>{signature.strength}</dd>
              </div>
              <div>
                <dt>Wear</dt>
                <dd>{signature.wear}</dd>
              </div>
              {v.size && (
                <div>
                  <dt>Size</dt>
                  <dd>{v.size}</dd>
                </div>
              )}
            </dl>

            <p className={styles.tagline}>{f.tagline}</p>
            <p className={styles.desc}>{f.description}</p>

            <Link href={`/fragrances/${f.parentSlug ?? `${f.slug}-15ml`}`} className={styles.formatLink}>
              {f.format === 'travel' ? 'Also available in 60 ml' : 'Discover the 15 ml · ₹799'}
            </Link>

            <ul className={styles.keyNotes} aria-label="Key notes">
              {f.keyNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>

            <div className={styles.priceRow}>
              <p className={styles.price}>{formatINR(v.price)}</p>
              <p className={styles.tax}>
                {v.size} · Inclusive of all taxes
              </p>
            </div>
            <ReserveNote className={styles.note} />

            <EditionMeter variantId={v.id} className={styles.meter} />

            <div ref={cta} className={styles.cta}>
              <ReserveButton variantId={v.id} price={v.price} block />
              <ConciergeButton block about={`${f.name} ${v.size}`} className={styles.concierge} />
            </div>

            <ul className={styles.assure}>
              <li>
                <Icon d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.6 1.6 0 1 0 0-.01M17 19a1.6 1.6 0 1 0 0-.01" />
                Complimentary delivery · next day in {site.delivery.fastPlace}
              </li>
              <li>
                <Icon d="M8 3h2v4l-1 1-1-1zM14 3h2v4l-1 1-1-1zM7 8h4v13H7zM13 8h4v13h-4z" />
                {vials.body}
              </li>
              <li>
                <Icon d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                Secure payment · UPI, RuPay, Visa, Mastercard, net banking
              </li>
              <li>
                <Icon d="M12 2l2.4 5 5.6.8-4 3.9.9 5.5L12 14.6 7.1 17.2l.9-5.5-4-3.9 5.6-.8z" />
                {f.format === 'travel' ? '24k gold flakes · glossy gold cap · gold lettering' : '24k gold flakes · engraved gold cap'}
              </li>
            </ul>

            <ProductDetails product={f} />

            <p className={styles.discovery}>
              Not ready for a full bottle?{' '}
              <Link href="/collection#discovery" className="link">
                The discovery set
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className={`${styles.bar} ${showBar ? styles.barOn : ''}`} aria-hidden={!showBar} inert={!showBar}>
        <div className={styles.barInfo}>
          <span className={`t-name ${styles.barName}`}>{f.name}</span>
          <span className={styles.barPrice}>
            {formatINR(v.price)} · {v.size}
          </span>
        </div>
        <ReserveButton variantId={v.id} className={styles.barBtn} />
      </div>
    </section>
  )
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}
