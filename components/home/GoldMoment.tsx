import Image from 'next/image'
import type { ResolvedMedia } from '@/lib/media'
import styles from './GoldMoment.module.css'

const FACTS = [
  { title: '24k gold flakes', text: 'Suspended in every bottle. Turn it and they rise.' },
  { title: 'The finest perfume oil', text: 'For a rich trail that stays on skin.' },
  { title: 'The best ingredients', text: 'Bourbon vanilla, frankincense, cedar and citron, chosen one by one.' },
]

/** The gold inside every bottle: the photograph on one half, a few words on the other. */
export default function GoldMoment({ media }: { media: ResolvedMedia }) {
  return (
    <section className={styles.gold} data-header="dark" aria-labelledby="gold-title">
      <div className={styles.photo}>
        {media.src && <Image src={media.src} alt={media.alt} fill sizes="(min-width: 900px) 50vw, 100vw" quality={90} className={styles.img} />}
      </div>

      <div className={styles.words}>
        <h2 id="gold-title" className={`t-title ${styles.title}`} data-reveal>
          Pure gold,
          <br />
          <span className="gold-text">and nothing less.</span>
        </h2>
        <dl className={styles.facts}>
          {FACTS.map((f, i) => (
            <div key={f.title} data-reveal style={{ '--d': `${0.08 + i * 0.08}s` } as React.CSSProperties}>
              <dt>{f.title}</dt>
              <dd>{f.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
