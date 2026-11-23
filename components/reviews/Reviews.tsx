import type { Review } from '@/lib/db'
import { fragrances } from '@/lib/catalog'
import styles from './Reviews.module.css'

const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
const nameOf = (slug: string) => fragrances.find((f) => f.slug === slug)?.name ?? ''

/**
 * Clients' own words, from the feedback card in every parcel. Only feedback the client agreed to share
 * and the house chose to show (/admin → Feedback). Renders nothing until there is some.
 */
export default function Reviews({ reviews, title = 'In their words', showFragrance = false }: { reviews: Review[]; title?: string; showFragrance?: boolean }) {
  if (!reviews.length) return null
  return (
    <section className={styles.section} data-header="light" aria-labelledby="reviews-title">
      <div className="wrap">
        <header className={styles.head}>
          <p className="t-eyebrow">From our clients</p>
          <h2 id="reviews-title" className={`t-title ${styles.title}`}>
            {title}
          </h2>
        </header>
        <ul className={styles.list}>
          {reviews.map((r) => (
            <li key={r.id} className={styles.card}>
              <p className={styles.stars} aria-label={`Scent rated ${r.scent} out of 5`}>
                {'★★★★★'.slice(0, r.scent)}
                <span aria-hidden>{'★★★★★'.slice(r.scent)}</span>
              </p>
              <blockquote className={styles.quote}>
                <p>{r.comments}</p>
              </blockquote>
              <p className={styles.by}>
                {r.name}
                <span>
                  {showFragrance && r.fragrance.length ? `${r.fragrance.map(nameOf).filter(Boolean).join(', ')} · ` : ''}
                  {monthYear(r.at)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
