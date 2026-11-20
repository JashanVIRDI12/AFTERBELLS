'use client'

import Link from 'next/link'
import { useState } from 'react'
import { fragrances } from '@/lib/catalog'
import { Emblem, Divider } from '@/components/brand/Brand'
import styles from './Feedback.module.css'

const RATINGS = [
  { key: 'scent', label: 'Scent' },
  { key: 'longevity', label: 'Longevity' },
  { key: 'packaging', label: 'Packaging' },
] as const
type RatingKey = (typeof RATINGS)[number]['key']

/** The digital twin of the printed feedback card — point its QR code to /feedback. */
export default function FeedbackForm() {
  const [picked, setPicked] = useState<string[]>([])
  const [rating, setRating] = useState<Record<RatingKey, number>>({ scent: 0, longevity: 0, packaging: 0 })
  const [comments, setComments] = useState('')
  const [name, setName] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!picked.length) return setError('Tell us which fragrance you received.')
    if (Object.values(rating).some((v) => v === 0)) return setError('Please rate scent, longevity and packaging.')
    setState('sending')
    const website = new FormData(e.currentTarget as HTMLFormElement).get('website') ?? ''
    try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fragrance: picked, ...rating, comments, name, orderNumber, website }),
    })
    if (res.ok) {
      setState('done')
    } else {
      setState('idle')
      setError((await res.json()).error ?? 'Something went wrong')
    }
    } catch {
      setState('idle')
      setError('Your feedback could not be sent. Please check your connection and try again.')
    }
  }

  return (
    <section className={styles.page} data-header="light">
      <div className={styles.card}>
        <div className={styles.brand}>
          <Emblem className={styles.emblem} />
          <p className="t-eyebrow lockup">Reserved for the exceptional</p>
        </div>

        {state === 'done' ? (
          <div className={styles.done}>
            <h1 className={styles.script}>
              <span className="gold-text">Thank you</span>
            </h1>
            <Divider className={styles.div} />
            <p>Your words have reached the house. Every card is read — and every one shapes the next hour we compose.</p>
            <Link href="/" className="btn btn--line">
              Return to the house
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form} noValidate>
            {/* honeypot: hidden from people, irresistible to bots */}
            <label className="hp" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <h1 className={styles.script}>
              <span className="gold-text">Your Feedback</span>
            </h1>
            <Divider className={styles.div} />
            <p className={styles.lead}>Your thoughts help us craft every note with care.</p>

            <fieldset className={styles.group}>
              <legend>Which fragrance did you receive?</legend>
              <div className={styles.chips}>
                {fragrances.map((f) => (
                  <label key={f.slug} className={`${styles.chip} ${picked.includes(f.slug) ? styles.chipOn : ''}`}>
                    <input type="checkbox" checked={picked.includes(f.slug)} onChange={() => toggle(f.slug)} />
                    {f.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Rate your experience</legend>
              {RATINGS.map((r) => (
                <div key={r.key} className={styles.rateRow} role="radiogroup" aria-label={r.label}>
                  <span className={styles.rateLabel}>{r.label}</span>
                  <span className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating[r.key] === n}
                        aria-label={`${n} of 5`}
                        className={n <= rating[r.key] ? styles.starOn : ''}
                        onClick={() => setRating((p) => ({ ...p, [r.key]: n }))}
                      >
                        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
                          <path
                            d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
                            stroke="currentColor"
                            strokeWidth="1"
                          />
                        </svg>
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </fieldset>

            <div className="field">
              <label htmlFor="fb-comments">Your comments</label>
              <textarea id="fb-comments" className={`input ${styles.lined}`} rows={4} maxLength={2000} value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
            <div className={styles.row}>
              <div className="field">
                <label htmlFor="fb-name">Name (optional)</label>
                <input id="fb-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="fb-order">Order no. (optional)</label>
                <input id="fb-order" className="input" placeholder="AB-1001" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button className="btn btn--gold btn--block" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send to the house'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
