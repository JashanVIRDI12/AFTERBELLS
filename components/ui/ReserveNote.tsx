'use client'

import { useId, useRef, useState } from 'react'
import { deliveryNote } from '@/lib/content'
import { arrivalLine, validPin } from '@/lib/delivery'
import { lookupPin } from '@/lib/india'
import { usePin, useUI } from '@/lib/stores'
import { track } from '@/lib/track'
import styles from './ReserveNote.module.css'

type Props = {
  className?: string
  /** Add the accepted payment methods on a second line */
  payments?: boolean
  /** Offer "Check your date": a PIN code field that turns the promise into a date */
  check?: boolean
}

/**
 * The delivery promise, set quietly under every Add to bag button. Once the guest has given a PIN
 * code (anywhere on the site) it becomes their date: "Arrives tomorrow, Tuesday 24 November · Gurugram".
 */
export default function ReserveNote({ className = '', payments = false, check = false }: Props) {
  const hydrated = useUI((s) => s.hydrated)
  const pin = usePin((s) => s.pin)
  const place = usePin((s) => s.place)
  const setPin = usePin((s) => s.setPin)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const known = hydrated && validPin(pin)

  const edit = () => {
    setDraft(known ? pin : '')
    setError('')
    setOpen(true)
    requestAnimationFrame(() => input.current?.focus())
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validPin(draft)) {
      setError('Enter a six-digit PIN code')
      input.current?.focus()
      return
    }
    setError('')
    setBusy(true)
    const found = await lookupPin(draft)
    setPin(draft, found?.city ?? '')
    setBusy(false)
    setOpen(false)
    track('delivery_check')
  }

  return (
    <div className={`${styles.note} ${className}`}>
      {open ? (
        <form className={styles.form} onSubmit={submit} noValidate>
          <label htmlFor={id} className={styles.label}>
            Delivery PIN code
          </label>
          <span className={styles.field}>
            <input
              ref={input}
              id={id}
              className={styles.input}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="110001"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-err` : undefined}
            />
            <button type="submit" className={styles.go} disabled={busy}>
              {busy ? 'Checking' : 'Check'}
            </button>
            <button type="button" className={styles.cancel} onClick={() => setOpen(false)} aria-label="Close">
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          </span>
          {error && (
            <span id={`${id}-err`} className={styles.err} role="alert">
              {error}
            </span>
          )}
        </form>
      ) : (
        <p className={styles.line} aria-live="polite">
          {known ? (
            <>
              <span className={styles.when}>{arrivalLine(pin)}</span>
              <span> · {place || `PIN ${pin}`}</span>
            </>
          ) : (
            // each promise stays whole: the line breaks between them, never inside one
            deliveryNote.split(' · ').map((part, i, all) => (
              <span key={part}>
                <span className={styles.nowrap}>
                  {part}
                  {i < all.length - 1 && '\u00a0·'}
                </span>{' '}
              </span>
            ))
          )}
          {check && hydrated && (
            <button type="button" className={styles.change} onClick={edit}>
              {known ? 'Change' : 'Check your date'}
            </button>
          )}
        </p>
      )}
      {payments && <span className={styles.pay}>Secure payment · UPI · RuPay · Visa · Mastercard</span>}
    </div>
  )
}
