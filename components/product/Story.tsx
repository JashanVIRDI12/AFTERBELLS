import type { Fragrance } from '@/lib/catalog'
import { markNotes, noteColour } from '@/lib/notes'
import { Divider } from '@/components/brand/Brand'
import styles from './Story.module.css'

/** The story, with each ingredient marked in its own colour. */
export default function Story({ product: f }: { product: Fragrance }) {
  const paragraphs = markNotes(f.story, [...f.notes.top, ...f.notes.heart, ...f.notes.base], f.name)
  let n = 0

  return (
    <section className={`section ${styles.story}`} data-header="light" aria-labelledby="story-title">
      <div className="wrap">
        <div className={styles.grid}>
          <div className={styles.left}>
            <p className="t-eyebrow" data-reveal>
              The story · {f.hourLabel}
            </p>
            <h2 id="story-title" className={styles.quote} data-reveal style={{ '--d': '.08s' } as React.CSSProperties}>
              “{f.tagline}”
            </h2>
            <Divider className={styles.div} />
          </div>

          <div className={styles.right}>
            {paragraphs.map((parts, i) => (
              <p key={i} className={i === 0 ? styles.first : styles.p} data-reveal style={{ '--d': `${0.08 * i}s` } as React.CSSProperties}>
                {parts.map((part, j) =>
                  typeof part === 'string' ? (
                    part
                  ) : (
                    <mark key={j} className={styles.note} style={{ '--c': noteColour(part.note), '--n': n++ } as React.CSSProperties}>
                      {part.text}
                    </mark>
                  ),
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
