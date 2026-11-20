import Link from 'next/link'
import type { Fragrance } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import MediaSlot from '@/components/media/MediaSlot'
import styles from './OtherHours.module.css'

export default function OtherHours({ products, media }: { products: Fragrance[]; media: Record<string, ResolvedMedia> }) {
  return (
    <section className={`section ${styles.other}`} data-header="light" aria-labelledby="other-title">
      <div className="wrap">
        <div className={styles.head}>
          <p className="t-eyebrow">Complete the hours</p>
          <h2 id="other-title" className="t-title t-h3">
            The other <span className="gold-text">hours</span>
          </h2>
        </div>
        <ul className={styles.grid}>
          {products.map((p) => (
            <li key={p.slug} data-reveal>
              <Link href={`/fragrances/${p.slug}`} className={styles.card}>
                <MediaSlot
                  media={media[p.media[0]]}
                  theme={p.theme}
                  label={p.label}
                  quiet
                  className={styles.frame}
                  sizes="(min-width: 900px) 40vw, 90vw"
                />
                <div className={styles.meta}>
                  <span className={styles.no}>No. {p.no}</span>
                  <span className={`t-name ${styles.name}`}>{p.name}</span>
                  <span className={styles.tag}>{p.tagline}</span>
                  <span className={styles.price}>{formatINR(p.variants[0].price)} · {p.variants[0].size}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
