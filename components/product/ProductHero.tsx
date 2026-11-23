'use client'

import Link from 'next/link'
import { Check, Gift } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Fragrance } from '@/lib/catalog'
import { fragrances, signature, travelFragrances } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import { site, whatsappLink } from '@/lib/site'
import { compliments } from '@/lib/content'
import { track } from '@/lib/track'
import MediaSlot from '@/components/media/MediaSlot'
import ReserveButton from '@/components/ui/ReserveButton'
import EditionMeter from '@/components/ui/EditionMeter'
import ReserveNote from '@/components/ui/ReserveNote'
import QtyStepper from '@/components/ui/QtyStepper'
import Accordion from '@/components/ui/Accordion'
import { GIFT_KEY } from '@/lib/stores'
import { detailRows } from './ProductDetails'
import VideoOption from './VideoOption'
import styles from './ProductHero.module.css'

/**
 * The product page's first screen, in the manner of the great houses: the photograph on the left,
 * one calm column on the right — name, family, price, size, quantity, gift, one button — and
 * everything else folded away in accordions.
 */
export default function ProductHero({ product: f, media }: { product: Fragrance; media: ResolvedMedia[] }) {
  const v = f.variants[0]
  // the other size of the same hour: the 15 ml from a 60 ml page, the 60 ml from a 15 ml page
  const other = f.format === 'travel' ? fragrances.find((p) => p.slug === f.parentSlug) : travelFragrances.find((t) => t.parentSlug === f.slug)
  const sizes = [f, ...(other ? [other] : [])]
    .map((p) => ({ label: p.variants[0].size, href: `/fragrances/${p.slug}`, current: p.slug === f.slug, price: p.variants[0].price }))
    .sort((a, b) => b.price - a.price)
  const gallery = useRef<HTMLDivElement>(null)
  const cta = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const [showBar, setShowBar] = useState(false)
  const [qty, setQty] = useState(1)
  const [gift, setGift] = useState(false)

  useEffect(() => {
    track('product_view', { slug: f.slug })
  }, [f.slug])

  // remember "make it a gift" from an earlier visit
  useEffect(() => {
    try {
      setGift(localStorage.getItem(GIFT_KEY) === '1')
    } catch {}
  }, [])
  const toggleGift = () => {
    const on = !gift
    setGift(on)
    try {
      if (on) localStorage.setItem(GIFT_KEY, '1')
      else localStorage.removeItem(GIFT_KEY)
    } catch {}
  }

  // The buy bar appears after the main button has scrolled past, and steps aside while another
  // buy block ([data-own-cta]) is on screen. The opening photograph and title stay unobstructed.
  useEffect(() => {
    const el = cta.current?.querySelector('button') ?? cta.current
    if (!el) return
    const others = [...document.querySelectorAll('[data-own-cta]')]
    let passed = false
    const seen = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === el) passed = e.intersectionRatio < 0.9 && e.boundingClientRect.top < 0
          else if (e.isIntersecting) seen.add(e.target)
          else seen.delete(e.target)
        }
        setShowBar(passed && seen.size === 0)
      },
      { threshold: [0, 0.9, 1] },
    )
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
    g.scrollTo({ left: i * g.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  const concierge = site.concierge[0]
  const finish =
    f.format === 'travel' ? '24k gold flakes · glossy gold-tone cap · gold-tone lettering' : '24k gold flakes · engraved zamac cap · gold-tone metal label'
  const wear = (label: string) => f.wear.find((w) => w.label === label)?.value

  const sections = [
    {
      q: 'Product description',
      a: (
        <div className={styles.acc}>
          <p className={styles.accLead}>{f.tagline}</p>
          <p>{f.description}</p>
          <dl className={styles.rows}>
            {wear('Moment') && (
              <div>
                <dt>Wear it</dt>
                <dd>{wear('Moment')}</dd>
              </div>
            )}
            {wear('Season') && (
              <div>
                <dt>Season</dt>
                <dd>{wear('Season')}</dd>
              </div>
            )}
            <div>
              <dt>For</dt>
              <dd>{signature.wear}: made to be worn by anyone</dd>
            </div>
          </dl>
        </div>
      ),
    },
    {
      q: 'Notes',
      a: (
        <dl className={styles.rows}>
          <div>
            <dt>Top</dt>
            <dd>{f.notes.top.join(', ')}</dd>
          </div>
          <div>
            <dt>Heart</dt>
            <dd>{f.notes.heart.join(', ')}</dd>
          </div>
          <div>
            <dt>Base</dt>
            <dd>{f.notes.base.join(', ')}</dd>
          </div>
        </dl>
      ),
    },
    {
      q: 'Details',
      a: (
        <dl className={styles.rows}>
          <div>
            <dt>Concentration</dt>
            <dd>
              {f.concentration} · {signature.strengthLabel}
            </dd>
          </div>
          <div>
            <dt>Finish</dt>
            <dd>{finish}</dd>
          </div>
          {detailRows(f).map(([k, val]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{val}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      q: 'Delivery & returns',
      a: (
        <div className={styles.acc}>
          <ReserveNote check />
          <p>
            {site.shipping.note}, tracked to your door. Cancel free of charge until your order is dispatched. For reasons of hygiene, opened
            bottles cannot be returned; a parcel that arrives damaged is replaced.{' '}
            <Link href="/policies#shipping">Delivery &amp; returns</Link>
          </p>
        </div>
      ),
    },
    {
      q: 'With every order',
      a: (
        <ul className={styles.list}>
          {compliments.map((c) => (
            <li key={c.key}>
              <b>{c.title}.</b> {c.body}
            </li>
          ))}
          <li>
            <b>The thank-you card.</b> With your message written inside, if you send it as a gift.
          </li>
        </ul>
      ),
    },
  ]

  return (
    <section className={styles.hero} data-header="light" aria-labelledby="p-name">
      <div className={styles.grid}>
        {/* the photographs: full bleed; stacked on large screens, swiped on phones */}
        <div className={styles.galleryCol}>
          <div
            ref={gallery}
            className={styles.gallery}
            onScroll={onGalleryScroll}
            role="region"
            aria-roledescription="carousel"
            aria-label={`${f.name} images`}
            tabIndex={0}
          >
            {media.map((m, i) => (
              <div key={m.slot} className={styles.slide}>
                <MediaSlot
                  media={m}
                  theme={f.theme}
                  label={i === 0 ? f.label : undefined}
                  priority={i === 0}
                  reveal={false}
                  // the frame is locked to the screen; the photograph fills it, cropped around the bottle
                  fit="cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={styles.frame}
                  hintAt="top"
                />
              </div>
            ))}
          </div>
          {media.length > 1 && (
            <div className={styles.dots} role="group" aria-label="Choose image">
              {media.map((m, i) => (
                <button
                  key={m.slot}
                  type="button"
                  aria-pressed={slide === i}
                  aria-label={`Show image ${i + 1} of ${media.length}${m.alt ? `: ${m.alt}` : ''}`}
                  className={slide === i ? styles.dotOn : ''}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* one calm column */}
        <div className={styles.panelCol}>
          <div className={styles.panel}>
            <header className={styles.head}>
              <h1 id="p-name" className={styles.name}>
                {f.name}
              </h1>
              <p className={styles.family}>
                {f.family.split(' · ').join(' | ')}
                {f.format === 'travel' ? ' | 15 ml' : ''}
              </p>
            </header>

            <div className={styles.priceRow}>
              <p className={styles.price}>{formatINR(v.price)}</p>
              <p className={styles.tax}>Inclusive of all taxes</p>
              {/* silent while simply available; speaks only at "Few remaining" or "Fully reserved" */}
              <EditionMeter variantId={v.id} className={styles.meter} quiet />
            </div>

            <div className={styles.choose}>
              <nav className={styles.sizes} aria-label="Size">
                {sizes.map((s) =>
                  s.current ? (
                    <span key={s.label} className={`${styles.size} ${styles.sizeOn}`} aria-current="page">
                      {s.label}
                    </span>
                  ) : (
                    <Link key={s.label} href={s.href} className={styles.size} title={`${s.label} · ${formatINR(s.price)}`}>
                      {s.label}
                    </Link>
                  ),
                )}
              </nav>

              <QtyStepper value={qty} max={site.edition.maxPerVariant} onChange={setQty} className={styles.qty} />

              <div className={styles.giftWrap}>
                <button type="button" className={styles.gift} aria-pressed={gift} onClick={toggleGift}>
                  <Gift size={22} strokeWidth={1.3} aria-hidden />
                  Make it a gift
                  {gift && (
                    <Check className={styles.tick} size={15} strokeWidth={1.8} aria-hidden />
                  )}
                </button>
                {gift && (
                  <p className={styles.giftNote}>
                    We will ask for your card message at checkout. It is written inside the thank-you card, and prices never appear in the
                    parcel.
                  </p>
                )}
              </div>
              {/* with every 60 ml bottle, ticked by default */}
              {f.format !== 'travel' && <VideoOption className={styles.video} />}
            </div>

            <div ref={cta} className={styles.cta}>
              <ReserveButton variantId={v.id} qty={qty} variant="ink" block className={styles.add} />
              <ReserveNote className={styles.note} check />
              <p className={styles.concierge}>
                Need advice?{' '}
                <a href={whatsappLink(`Hello After Bells, I have a question about ${f.name} ${v.size}.`)} target="_blank" rel="noopener noreferrer" onClick={() => track('concierge_whatsapp')}>
                  WhatsApp our concierge
                </a>{' '}
                or call{' '}
                <a href={`tel:${concierge.tel}`} onClick={() => track('concierge_call')}>
                  {concierge.display}
                </a>
              </p>
            </div>

            <Accordion items={sections} className={styles.accordion} />

            <p className={styles.finder}>
              Not sure this is your hour? <Link href="/collection#find-your-hour">Three questions</Link>
            </p>
          </div>
        </div>
      </div>

      <div className={`${styles.bar} ${showBar ? styles.barOn : ''}`} aria-hidden={!showBar} inert={!showBar}>
        <div className={styles.barInfo}>
          <span className={styles.barName}>{f.name}</span>
          <span className={styles.barPrice}>
            {formatINR(v.price)} · {v.size}
          </span>
        </div>
        <ReserveButton variantId={v.id} qty={qty} variant="ink" className={styles.barBtn} />
      </div>
    </section>
  )
}
