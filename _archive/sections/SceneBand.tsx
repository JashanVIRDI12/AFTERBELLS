import Link from 'next/link'
import Image from 'next/image'
import type { Fragrance } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import Corners from '@/components/ui/Corners'
import ReserveButton from '@/components/ui/ReserveButton'
import ReserveNote from '@/components/ui/ReserveNote'
import styles from './SceneBand.module.css'

/**
 * One fragrance in a real room: the photograph fills the section under a quiet,
 * even overlay, and a framed glass card sits in the open space beside the bottle.
 */
export default function SceneBand({ product: f, media }: { product: Fragrance; media: ResolvedMedia }) {
  if (!media.src) return null
  const v = f.variants[0]

  return (
    <section className={styles.band} data-header="dark" aria-labelledby={`${f.slug}-spot`} data-own-cta>
      <div className={styles.bg} aria-hidden>
        <Image src={media.src} alt="" fill sizes="100vw" quality={92} className={styles.img} />
        <span className={styles.overlay} />
      </div>

      <div className={`wrap ${styles.stage}`}>
        <div className={`${styles.card} glass heritage`} data-reveal>
          <Corners />
          <p className={`t-eyebrow ${styles.kicker}`}>{f.family}</p>
          <h2 id={`${f.slug}-spot`} className={`t-title ${styles.title}`}>
            {f.name}
          </h2>
          <p className={styles.tagline}>{f.tagline}</p>
          <div className={styles.ornament} aria-hidden>
            <span />
            <i />
            <span />
          </div>
          <p className={styles.notes}>{f.keyNotes.join(' · ')}</p>
          <p className={styles.price}>
            {formatINR(v.price)} <span className={styles.size}>· {v.size}</span>
          </p>
          <div className={styles.ctas}>
            <ReserveButton variantId={v.id} block />
            <ReserveNote className={styles.note} />
            <Link href={`/fragrances/${f.slug}`} className={`link ${styles.more}`}>
              Discover {f.name}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
