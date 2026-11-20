import type { Store } from '@/lib/db'
import { fragrances } from '@/lib/catalog'
import { removeFeedbackAction } from '../actions'
import { Back, fmtDate } from './shared'
import styles from '../Admin.module.css'

export default async function FeedbackList({ store }: { store: Store }) {
  const feedback = (await store.listFeedback()).reverse()
  const name = (slug: string) => fragrances.find((f) => f.slug === slug)?.name ?? slug
  const avg = (k: 'scent' | 'longevity' | 'packaging') =>
    feedback.length ? (feedback.reduce((s, f) => s + f[k], 0) / feedback.length).toFixed(1) : '—'
  return (
    <>
      <div className={styles.kpis}>
        <div>
          <span>Responses</span>
          <b>{feedback.length}</b>
        </div>
        <div>
          <span>Scent</span>
          <b>{avg('scent')}</b>
        </div>
        <div>
          <span>Longevity</span>
          <b>{avg('longevity')}</b>
        </div>
        <div>
          <span>Packaging</span>
          <b>{avg('packaging')}</b>
        </div>
      </div>
      <p className={styles.hint}>
        From the feedback card&apos;s QR code (/feedback). <a href="/api/admin/export?type=feedback">Export (CSV)</a>
      </p>
      <ul className={styles.feedback}>
        {feedback.map((f) => (
          <li key={f.id}>
            <p>
              <b>{f.fragrance.map(name).join(', ')}</b> · scent {f.scent} · longevity {f.longevity} · packaging {f.packaging}
              <small>
                {' '}
                — {f.name || 'Anonymous'} {f.orderNumber && `(${f.orderNumber})`} · {fmtDate(f.at)}
                {f.consent ? ' · may quote' : ''}
              </small>
            </p>
            {f.comments && <blockquote>{f.comments}</blockquote>}
            <form action={removeFeedbackAction}>
              <Back q="tab=feedback" />
              <input type="hidden" name="feedbackId" value={f.id} />
              <button className={styles.textBtn}>Remove</button>
            </form>
          </li>
        ))}
        {!feedback.length && <li>No feedback yet.</li>}
      </ul>
    </>
  )
}
