import Link from 'next/link'
import { fragrances } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import MediaSlot from '@/components/media/MediaSlot'
import ReserveButton from '@/components/ui/ReserveButton'
import ConciergeButton from '@/components/ui/ConciergeButton'
import ReserveNote from '@/components/ui/ReserveNote'
import styles from './ReserveStrip.module.css'

const HOURS: Record<string, string> = { 'amber-hour': 'Dusk', 'open-sky': 'Dawn', 'iron-crown': 'Midnight' }

/** The close of the page: choose your hour and reserve, without leaving it. */
export default function ReserveStrip({ media }: { media: Record<string, ResolvedMedia> }) {
  return (
    <section className={styles.section} data-header="dark" aria-labelledby="strip-h">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>
            Choose your hour
          </p>
          <h2 id="strip-h" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            Reserve the <span className="gold-text">First Edition.</span>
          </h2>
        </header>
        <ul className={styles.grid}>
          {fragrances.map((f, i) => (
            <li
              key={f.slug}
              className={styles.item}
              data-reveal
              style={{ '--d': `${i * 0.08}s`, '--accent': f.theme.accent } as React.CSSProperties}
            >
              <Link href={`/fragrances/${f.slug}`} className={styles.visual} aria-label={`Discover ${f.name}`}>
                <span className={styles.glow} aria-hidden />
                <MediaSlot
                  media={media[`${f.slug}-cutout`]}
                  transparent
                  reveal={false}
                  theme={f.theme}
                  label={f.label}
                  className={styles.cut}
                  sizes="(min-width: 900px) 20vw, 50vw"
                />
              </Link>
              <p className={styles.hour}>{HOURS[f.slug]}</p>
              <h3 className={`t-name ${styles.name}`}>{f.name}</h3>
              <p className={styles.price}>
                {formatINR(f.variants[0].price)} · {f.variants[0].size}
              </p>
              <ReserveButton variantId={f.variants[0].id} variant="line" block className={styles.reserve} />
            </li>
          ))}
        </ul>
        <ReserveNote className={styles.note} />
        <div className={styles.help} data-reveal>
          <p>Not sure which hour is yours?</p>
          <ConciergeButton variant="link" />
        </div>
      </div>
    </section>
  )
}
