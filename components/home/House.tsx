import Link from 'next/link'
import type { ResolvedMedia } from '@/lib/media'
import { editionPrice } from '@/lib/pricing'
import MediaSlot from '@/components/media/MediaSlot'
import { Emblem } from '@/components/brand/Brand'
import styles from './House.module.css'

const warm = { bg: '#3a2a1c', bg2: '#6a4a2a', accent: '#DEBC68', tone: 'dark' as const }

/** The House: a letterhead beside two photographs, hung as an offset pair. */
export default function House({ media }: { media: Record<string, ResolvedMedia> }) {
  const plates = [media['maison-atelier'], media['maison-materials']]

  return (
    <section id="house" className={styles.house} data-header="light" aria-labelledby="house-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.text}>
          <Emblem className={styles.crest} />
          <p className={`t-eyebrow ${styles.kicker}`} data-reveal>
            The House
          </p>
          <h2 id="house-title" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
            A house of <span className="gold-text">few</span>
            <br />
            perfumes.
          </h2>
          <div className={styles.ornament} aria-hidden data-reveal style={{ '--d': '.1s' } as React.CSSProperties}>
            <span />
            <i />
            <span />
          </div>
          <p className={styles.lede} data-reveal style={{ '--d': '.12s' } as React.CSSProperties}>
            We make few perfumes, and few bottles of each. Every one is sold only by the house, at a fair price.
          </p>
          <p className={styles.sign} data-reveal style={{ '--d': '.16s' } as React.CSSProperties}>
            <span>Sold only by the house</span>
            <span>{editionPrice().label}</span>
          </p>
          <Link href="/house" className="link" data-reveal style={{ '--d': '.2s' } as React.CSSProperties}>
            Our story
          </Link>
        </div>

        <div className={styles.plates}>
          {plates.map((m, i) => (
            <div key={m.slot} className={styles.plate} data-reveal style={{ '--d': `${0.08 + i * 0.12}s` } as React.CSSProperties}>
              <MediaSlot media={m} theme={warm} parallax className={styles.photo} sizes="(min-width: 900px) 24vw, 46vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
