import Image from 'next/image'
import Link from 'next/link'
import type { ResolvedMedia } from '@/lib/media'
import { editionPrice, formatINR } from '@/lib/pricing'
import { site } from '@/lib/site'
import Corners from '@/components/ui/Corners'
import styles from './FairPrice.module.css'

/** The closing promise: a fair price, made once — on gilt glass over the collection. */
export default function FairPrice({ media }: { media: ResolvedMedia }) {
  const price = editionPrice()
  return (
    <section className={styles.fair} data-header="dark" aria-labelledby="fair-h">
      <div className={styles.backdrop} aria-hidden>
        {media.src && <Image src={media.src} alt="" fill sizes="100vw" quality={85} className={styles.img} />}
        <span className={styles.veil} />
      </div>
      <div className="wrap">
        <div className={`${styles.card} glass heritage`} data-reveal>
          <Corners />
          <div className={styles.cols}>
            <div className={styles.col}>
              <p className={`t-eyebrow ${styles.kicker}`}>A fair price</p>
              <p className={styles.from}>
                <span className={styles.fromLabel}>{price.same ? 'Every bottle' : 'From'}</span>
                <span className="gold-text">{formatINR(price.amount)}</span>
              </p>
              <p className={styles.body}>
                We sell only from this house, with no agents, shops or advertising in between. What you pay is for the
                perfume.
              </p>
            </div>
            <span className={styles.divider} aria-hidden />
            <div className={styles.col}>
              <p className={`t-eyebrow ${styles.kicker}`}>The {site.edition.name}</p>
              <h2 id="fair-h" className={`t-title ${styles.title}`}>
                Made <span className="gold-text">once.</span>
              </h2>
              <p className={styles.body}>
                Each perfume is made once. When the edition sells out, it closes.
              </p>
            </div>
          </div>
          <div className={styles.ctas}>
            <Link href="/collection" className="btn btn--gold">
              Discover the collection
            </Link>
            <Link href="/policies#shipping" className={`link ${styles.more}`}>
              Delivery &amp; returns
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
