'use client'

import { useId, useState } from 'react'
import type { LeadKind } from '@/lib/db/types'
import { cleanPhone, markKnown, sendLead, validEmail, validPhone } from '@/lib/leads'
import { track } from '@/lib/track'
import styles from './ContactCapture.module.css'

type Props = {
  kind: LeadKind
  /** fragrance slug or variant id this is about */
  about?: string
  /** button label */
  cta: string
  /** the promise, under the field: what the guest gets, and how often */
  note: string
  /** shown once sent */
  thanks: (via: 'email' | 'whatsapp') => string
  /** offer the house letters as well (unticked) */
  salonOption?: boolean
  /** always add an email to the house letters (the Salon form itself) */
  salon?: boolean
  start?: 'email' | 'whatsapp'
  tone?: 'light' | 'dark'
  className?: string
  onDone?: () => void
}

/**
 * Email or WhatsApp — the guest chooses. One field, one button. Used by the finder,
 * "tell me when it returns" and the house letters.
 */
export default function ContactCapture({ kind, about, cta, note, thanks, salonOption, salon, start = 'whatsapp', tone = 'light', className = '', onDone }: Props) {
  const uid = useId()
  const [via, setVia] = useState<'email' | 'whatsapp'>(start)
  const [value, setValue] = useState('')
  const [letters, setLetters] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const hp = String(new FormData(e.currentTarget).get('website') ?? '')
    const ok = via === 'email' ? validEmail(value) : validPhone(value)
    if (!ok) {
      setError(via === 'email' ? 'Enter a valid email address' : 'Enter a 10-digit Indian mobile number')
      return
    }
    setError('')
    setState('sending')
    const res = await sendLead({
      kind,
      about,
      ...(via === 'email' ? { email: value.trim() } : { phone: cleanPhone(value) }),
      salon: via === 'email' && (salon || letters),
      website: hp,
    })
    if (!res.ok) {
      setState('idle')
      setError(res.error)
      return
    }
    markKnown()
    track('lead_capture')
    if (via === 'email' && (salon || letters)) track('salon_join')
    setState('done')
    onDone?.()
  }

  if (state === 'done') {
    return (
      <p className={`${styles.done} ${tone === 'dark' ? styles.dark : ''} ${className}`} role="status">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        {thanks(via)}
      </p>
    )
  }

  const inputId = `${uid}-contact`
  return (
    <form className={`${styles.form} ${tone === 'dark' ? styles.dark : ''} ${className}`} onSubmit={submit} noValidate>
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className={styles.switch} role="radiogroup" aria-label="How should we reach you?">
        {(['whatsapp', 'email'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={via === v}
            className={via === v ? styles.on : ''}
            onClick={() => {
              setVia(v)
              setValue('')
              setError('')
            }}
          >
            {v === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </button>
        ))}
      </div>
      <label htmlFor={inputId} className="sr-only">
        {via === 'email' ? 'Email address' : 'WhatsApp number'}
      </label>
      <div className={styles.row}>
        {via === 'whatsapp' && <span className={styles.prefix}>+91</span>}
        <input
          id={inputId}
          className={styles.input}
          key={via}
          type={via === 'email' ? 'email' : 'tel'}
          inputMode={via === 'email' ? 'email' : 'numeric'}
          autoComplete={via === 'email' ? 'email' : 'tel-national'}
          maxLength={via === 'email' ? 120 : 14}
          placeholder={via === 'email' ? 'Your email address' : 'Your WhatsApp number'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={`${uid}-note`}
          disabled={state === 'sending'}
        />
        <button className={`btn btn--gold ${styles.go}`} type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : cta}
        </button>
      </div>
      {salonOption && via === 'email' && !salon && (
        <label className={styles.check}>
          <input type="checkbox" checked={letters} onChange={(e) => setLetters(e.target.checked)} />
          <span>Also send me the house letters, once a month at most.</span>
        </label>
      )}
      <p id={`${uid}-note`} className={`${styles.note} ${error ? styles.err : ''}`} role={error ? 'alert' : undefined}>
        {error || note}
      </p>
    </form>
  )
}
