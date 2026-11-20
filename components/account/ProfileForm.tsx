'use client'

import { startTransition, useActionState, useState } from 'react'
import { saveProfile, type ProfileState } from '@/app/account/actions'
import { INDIAN_STATES } from '@/lib/india'
import styles from './Account.module.css'

export type ProfileFields = {
  name: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  pin: string
}

type Props = {
  email: string
  initial: ProfileFields
  /** the details came from their latest order and have not been saved yet */
  fromOrder: boolean
  subscribed: boolean
}

/**
 * The client's own details. Submitted by hand (not through the form's `action`), because React
 * resets a form after its action runs and a controlled <select> would jump back to "Choose…".
 */
export default function ProfileForm({ email, initial, fromOrder, subscribed }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {})
  const [f, setF] = useState<ProfileFields>(initial)
  const [news, setNews] = useState(subscribed)
  const [dirty, setDirty] = useState(false)

  const set = (k: keyof ProfileFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }))
    setDirty(true)
  }
  const err = (k: keyof ProfileFields) => state.fields?.[k]
  const field = (k: keyof ProfileFields) => ({
    id: `pf-${k}`,
    name: k,
    value: f[k],
    onChange: set(k),
    'aria-invalid': !!err(k),
    'aria-describedby': err(k) ? `pf-${k}-err` : undefined,
  })
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDirty(false)
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }
  const Err = ({ k }: { k: keyof ProfileFields }) =>
    err(k) ? (
      <span id={`pf-${k}-err`} className="err">
        {err(k)}
      </span>
    ) : null

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {fromOrder && <p className={styles.note}>Filled in from your latest order. Save to keep these details for checkout.</p>}

      <div className={styles.row2}>
        <div className="field">
          <label>Email</label>
          <p className={styles.static}>{email}</p>
        </div>
        <div className="field">
          <label htmlFor="pf-phone">Mobile</label>
          <div className={styles.prefixWrap}>
            <span className={styles.prefix}>+91</span>
            <input {...field('phone')} className={`input ${styles.withPrefix}`} inputMode="tel" autoComplete="tel-national" required />
          </div>
          <Err k="phone" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-name">Full name</label>
        <input {...field('name')} className="input" autoComplete="name" required />
        <Err k="name" />
      </div>

      <div className="field">
        <label htmlFor="pf-address1">Address</label>
        <input {...field('address1')} className="input" autoComplete="address-line1" required />
        <Err k="address1" />
      </div>
      <div className="field">
        <label htmlFor="pf-address2">Apartment, landmark (optional)</label>
        <input {...field('address2')} className="input" autoComplete="address-line2" />
      </div>

      <div className={styles.row3}>
        <div className="field">
          <label htmlFor="pf-city">City</label>
          <input {...field('city')} className="input" autoComplete="address-level2" required />
          <Err k="city" />
        </div>
        <div className="field">
          <label htmlFor="pf-state">State</label>
          <select {...field('state')} className="input" autoComplete="address-level1" required>
            <option value="">Choose…</option>
            {INDIAN_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <Err k="state" />
        </div>
        <div className="field">
          <label htmlFor="pf-pin">PIN code</label>
          <input {...field('pin')} className="input" inputMode="numeric" autoComplete="postal-code" maxLength={6} required />
          <Err k="pin" />
        </div>
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          name="news"
          checked={news}
          onChange={(e) => {
            setNews(e.target.checked)
            setDirty(true)
          }}
        />
        <span>Write to me about new editions and private previews. Rarely, and never shared.</span>
      </label>

      <div className={styles.actions}>
        <button className="btn btn--gold" disabled={pending}>
          {pending ? 'Saving…' : 'Save details'}
        </button>
        {state.ok && !dirty && !pending && (
          <span className={styles.saved} role="status">
            Saved. Checkout will use these details.
          </span>
        )}
        {state.error && (
          <span className={styles.error} role="alert">
            {state.error}
          </span>
        )}
      </div>
    </form>
  )
}
