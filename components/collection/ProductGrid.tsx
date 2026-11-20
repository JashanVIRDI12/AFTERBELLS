import Link from 'next/link'
import { fragrances, signature } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import MediaSlot from '@/components/media/MediaSlot'
import EditionMeter from '@/components/ui/EditionMeter'
import ReserveButton from '@/components/ui/ReserveButton'
import styles from './ProductGrid.module.css'
import ReserveNote from '@/components/ui/ReserveNote'

/** The shop grid: portrait, name, price, stock status and a direct Add to bag. */
export default function ProductGrid({ media }: { media: Record<string, ResolvedMedia> }) {
  return (
    <section id="fragrances" className={`section ${styles.section}`} data-header="light" aria-label="Fragrances">
      <ul className={`wrap ${styles.grid}`}>
        {fragrances.map((f, i) => {
          const v = f.variants[0]
          return (
            <li
              key={f.slug}
              className={styles.tile}
              data-reveal
              style={{ '--d': `${i * 0.08}s`, '--accent': f.theme.accent } as React.CSSProperties}
            >
              <Link href={`/fragrances/${f.slug}`} className={styles.visual} aria-label={`Discover ${f.name}`}>
                <MediaSlot
                  media={media[`${f.slug}-bottle`]}
                  theme={f.theme}
                  label={f.label}
                  reveal={false}
                  className={styles.photo}
                  sizes="(min-width: 1100px) 31vw, (min-width: 700px) 46vw, 92vw"
                />
                <MediaSlot
                  media={media[`${f.slug}-mood`]}
                  theme={f.theme}
                  reveal={false}
                  quiet
                  className={`${styles.photo} ${styles.alt}`}
                  sizes="(min-width: 1100px) 31vw, 46vw"
                />
              </Link>

              <div className={styles.info}>
                <p className={styles.meta}>
                  {f.family} · {signature.wear}
                </p>
                <h2 className={`t-name ${styles.name}`}>
                  <Link href={`/fragrances/${f.slug}`}>{f.name}</Link>
                </h2>
                <p className={styles.tagline}>{f.tagline}</p>
                <p className={styles.keys}>{f.keyNotes.join(' · ')}</p>
                <div className={styles.priceRow}>
                  <p className={styles.price}>
                    {formatINR(v.price)}
                    <small>{v.size} · Inclusive of taxes</small>
                  </p>
                  <EditionMeter variantId={v.id} compact quiet className={styles.meter} />
                </div>
                <div className={styles.actions}>
                  <ReserveButton variantId={v.id} variant="line" className={styles.reserve} />
                  <Link href={`/fragrances/${f.slug}`} className="link">
                    Discover
                  </Link>
                </div>
                <ReserveNote />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
