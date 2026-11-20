import type { Store } from '@/lib/db'
import { addSubscriberAction, removeSubscriberAction } from '../actions'
import { Back, fmtDay } from './shared'
import styles from '../Admin.module.css'

export default async function Salon({ store }: { store: Store }) {
  const subs = (await store.listSubscribers()).reverse()
  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          {subs.length} member{subs.length === 1 ? '' : 's'} of the Salon. <a href="/api/admin/export?type=subscribers">Export (CSV)</a>
        </p>
        <form action={addSubscriberAction} className={styles.search}>
          <Back q="tab=salon" />
          <input name="email" type="email" required placeholder="Add an email address" aria-label="Email to add" />
          <button className="btn btn--line">Add</button>
        </form>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Joined</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.email}>
                <td>
                  <a href={`mailto:${s.email}`}>{s.email}</a>
                </td>
                <td>{fmtDay(s.at)}</td>
                <td>{s.source ?? 'website'}</td>
                <td>
                  <form action={removeSubscriberAction}>
                    <Back q="tab=salon" />
                    <input type="hidden" name="email" value={s.email} />
                    <button className={styles.textBtn}>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {!subs.length && (
              <tr>
                <td colSpan={4}>No members yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
