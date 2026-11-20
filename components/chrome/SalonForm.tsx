'use client'

import { useState } from 'react'
import { track } from '@/lib/track'
import styles from './Footer.module.css'

export default function SalonForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const email = fd.get('email')
    setState('sending')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, website: fd.get('website') ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setState('done')
      track('salon_join')
      setMsg('You’re on the list. Watch your inbox for letters from After Bells.')
      form.reset()
    } catch (err) {
      setState('error')
      setMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate={false}>
      {/* honeypot: hidden from people, irresistible to bots */}
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label htmlFor="salon-email" className="sr-only">
        Email address
      </label>
      <div className={styles.inputRow}>
        <input
          id="salon-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="Your email address"
          className={styles.input}
          disabled={state === 'sending'}
        />
        <button className={`btn btn--gold ${styles.submit}`} type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Keep me informed'}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M4 12h15M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
      <p className={`${styles.formMsg} ${state === 'error' ? styles.formErr : ''}`} role="status" aria-live="polite">
        {msg || 'By joining you agree to receive emails from After Bells. Unsubscribe anytime.'}
      </p>
    </form>
  )
}
