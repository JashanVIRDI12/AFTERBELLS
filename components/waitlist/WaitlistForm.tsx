'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { site } from '@/lib/site'
import { track, visitOrigin } from '@/lib/track'
import { cleanPhone, markKnown, validEmail, validPhone } from '@/lib/leads'
import styles from '@/app/waitlist/Waitlist.module.css'

const HOURS = [
  { id: 'amber-hour', name: 'Amber Hour', note: 'warm' },
  { id: 'open-sky', name: 'Open Sky', note: 'fresh' },
  { id: 'iron-crown', name: 'Iron Crown', note: 'smoky' },
  { id: 'undecided', name: 'Not sure', note: 'help me' },
] as const

/** Remembered in this browser, so a returning guest sees they are already on the list. */
const JOINED = 'ab-waitlist'

type Contact = { phone?: string; email?: string }

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, origin: visitOrigin() }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.error ?? 'Something went wrong. Please try again.')
  }
}

/**
 * One field, one button: the place on the list is taken at once. Which hour calls to them, and a first name,
 * are asked afterwards and are optional, so they never stand between a guest and the list.
 */
export default function WaitlistForm() {
  const [step, setStep] = useState<'join' | 'more' | 'done'>('join')
  const [via, setVia] = useState<'whatsapp' | 'email'>('whatsapp')
  const [value, setValue] = useState('')
  const [contact, setContact] = useState<Contact>({})
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      if (localStorage.getItem(JOINED)) setStep('done')
    } catch {}
  }, [])

  const join = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const hp = String(new FormData(e.currentTarget).get('website') ?? '')
    const v = value.trim()
    if (via === 'whatsapp' ? !validPhone(v) : !validEmail(v)) {
      return setError(via === 'whatsapp' ? 'Enter a 10-digit Indian mobile number.' : 'Enter a valid email address.')
    }
    const c: Contact = via === 'whatsapp' ? { phone: cleanPhone(v) } : { email: v }
    setError('')
    setBusy(true)
    try {
      await post({ ...c, website: hp })
      try {
        localStorage.setItem(JOINED, '1')
      } catch {}
      markKnown()
      track('waitlist_join')
      setContact(c)
      setStep('more')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const more = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!picked.length && !name.trim()) return setStep('done')
    setBusy(true)
    try {
      await post({ ...contact, name: name.trim(), interests: picked })
    } catch {
      // the place on the list is already kept; the extras are a nicety
    }
    setBusy(false)
    setStep('done')
  }

  if (step === 'done') {
    const share = `I have joined the waitlist for After Bells: perfumes made in India, with flakes of gold drifting in every bottle. ${site.url}/waitlist`
    return (
      <div className={styles.done} role="status">
        <span className={styles.doneMark} aria-hidden>
          <Check size={22} strokeWidth={1.8} />
        </span>
        <p className={styles.doneTitle}>You are on the list.</p>
        <p className={styles.doneBody}>We will tell you the moment the First Edition opens, before anyone else.</p>
        <a className={`btn btn--gold ${styles.share}`} href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer">
          Tell a friend on WhatsApp
        </a>
      </div>
    )
  }

  if (step === 'more') {
    return (
      <form className={styles.more} onSubmit={more}>
        <p className={styles.doneTitle}>
          <Check size={18} strokeWidth={1.8} aria-hidden /> You are on the list.
        </p>
        <p className={styles.doneBody}>If you wish, tell us which perfume you are drawn to.</p>
        <div className={styles.chips}>
          {HOURS.map((h) => (
            <button
              key={h.id}
              type="button"
              aria-pressed={picked.includes(h.id)}
              className={styles.chip}
              onClick={() => setPicked((p) => (p.includes(h.id) ? p.filter((x) => x !== h.id) : [...p, h.id]))}
            >
              {h.name} <small>{h.note}</small>
            </button>
          ))}
        </div>
        <label htmlFor="wl-name" className="sr-only">
          First name
        </label>
        <div className={styles.row}>
          <input id="wl-name" className={styles.input} autoComplete="given-name" placeholder="Your first name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <button className={`btn btn--gold ${styles.go}`} type="submit" disabled={busy}>
            {busy ? 'Saving…' : picked.length || name.trim() ? 'Save' : 'Skip'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form className={styles.form} onSubmit={join} noValidate>
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className={styles.switch} role="radiogroup" aria-label="How should we tell you?">
        {(['whatsapp', 'email'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={via === v}
            className={via === v ? styles.switchOn : ''}
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
      <label htmlFor="wl-contact" className="sr-only">
        {via === 'whatsapp' ? 'WhatsApp number' : 'Email address'}
      </label>
      <div className={styles.row}>
        <div className={styles.field}>
          {via === 'whatsapp' && <span className={styles.prefix}>+91</span>}
          <input
            id="wl-contact"
            key={via}
            className={styles.input}
            type={via === 'whatsapp' ? 'tel' : 'email'}
            inputMode={via === 'whatsapp' ? 'numeric' : 'email'}
            autoComplete={via === 'whatsapp' ? 'tel-national' : 'email'}
            placeholder={via === 'whatsapp' ? 'Your WhatsApp number' : 'Your email address'}
            maxLength={via === 'whatsapp' ? 14 : 120}
            enterKeyHint="go"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
            aria-describedby="wl-note"
          />
        </div>
        <button className={`btn btn--gold ${styles.go}`} type="submit" disabled={busy}>
          {busy ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      <p id="wl-note" className={`${styles.note} ${error ? styles.noteErr : ''}`} role={error ? 'alert' : undefined}>
        {error || 'One message when we open. Nothing else, and you can leave at any time.'}
      </p>
    </form>
  )
}
