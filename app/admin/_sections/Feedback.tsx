import type { Store } from '@/lib/db'
import { fragrances } from '@/lib/catalog'
import { publishFeedbackAction, removeFeedbackAction } from '../actions'
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
        From the feedback card&apos;s QR code (/feedback). Feedback the client agreed to share can be shown on the product pages and the home
        page, with their first name and initial. <a href="/api/admin/export?type=feedback">Export (CSV)</a>
      </p>
      <ul className={styles.feedback}>
        {feedback.map((f) => (
          <li key={f.id}>
            <p>
              <b>{f.fragrance.map(name).join(', ')}</b> · scent {f.scent} · longevity {f.longevity} · packaging {f.packaging}
              <small>
                {' '}
                — {f.name || 'Anonymous'} {f.orderNumber && `(${f.orderNumber})`} · {fmtDate(f.at)}
                {f.consent ? (f.published ? ' · shown on the site' : ' · may be shared') : ''}
              </small>
            </p>
            {f.comments && <blockquote>{f.comments}</blockquote>}
            {f.consent && f.comments && (
              <form action={publishFeedbackAction}>
                <Back q="tab=feedback" />
                <input type="hidden" name="feedbackId" value={f.id} />
                <input type="hidden" name="on" value={f.published ? '0' : '1'} />
                <button className={styles.textBtn}>{f.published ? 'Take off the site' : 'Show on the site'}</button>
              </form>
            )}
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
