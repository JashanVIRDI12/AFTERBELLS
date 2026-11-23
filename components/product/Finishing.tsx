import type { Fragrance } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import MediaSlot from '@/components/media/MediaSlot'
import styles from './Finishing.module.css'

export default function Finishing({ product: f, media }: { product: Fragrance; media: ResolvedMedia }) {
  return (
    <section className={`section ${styles.fin}`} data-header="light" aria-labelledby="fin-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="t-eyebrow" data-reveal>
            The finishing
          </p>
          <h2 id="fin-title" className="t-title t-h3" data-reveal style={{ '--d': '.08s' } as React.CSSProperties}>
            Gold inside, <span className="gold-text">crafted outside</span>
          </h2>
          <ul className={styles.list}>
            <li data-reveal>
              <b>24k gold flakes</b>
              Suspended in every bottle of {f.name} — turn it gently and watch them drift.
            </li>
            <li data-reveal style={{ '--d': '.06s' } as React.CSSProperties}>
              <b>{f.format === 'travel' ? 'Glossy gold-tone cap' : 'Engraved zamac cap'}</b>
              {f.format === 'travel'
                ? 'A small removable cap and atomizer in polished gold tone, with gold-tone lettering along the glass.'
                : 'A heavy, sculpted square cap of zamac, finished in warm gold tone.'}
            </li>
            <li data-reveal style={{ '--d': '.12s' } as React.CSSProperties}>
              <b>The thank-you card</b>Packed with every bottle — with your gift message, if you leave one.
            </li>
          </ul>
        </div>
        <div className={styles.visual} data-reveal>
          <MediaSlot media={media} className={styles.photo} sizes="(min-width: 900px) 42vw, 92vw" />
        </div>
      </div>
    </section>
  )
}
