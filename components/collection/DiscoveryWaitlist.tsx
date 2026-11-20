'use client'

import { useState } from 'react'
import { discovery, vials } from '@/lib/content'
import { track } from '@/lib/track'
import Corners from '@/components/ui/Corners'
import styles from './DiscoveryWaitlist.module.css'

/** The discovery set is not on sale yet: guests leave an email to hear first. */
export default function DiscoveryWaitlist() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    setState('sending')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), website: fd.get('website') ?? '', list: 'discovery' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setState('done')
      track('discovery_waitlist')
      setMsg('You will hear first when the discovery set is ready.')
      form.reset()
    } catch (err) {
      setState('error')
      setMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <section id="discovery" className={styles.section} data-header="light" aria-labelledby="discovery-title">
      <div className="wrap">
        <div className={`${styles.card} heritage`} data-reveal>
          <Corners />
          <p className={`t-eyebrow ${styles.kicker}`}>Coming soon</p>
          <h2 id="discovery-title" className={`t-title ${styles.title}`}>
            {discovery.title}
          </h2>
          <p className={styles.body}>{discovery.body}</p>
          <form className={styles.form} onSubmit={submit}>
            <label className="hp" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label htmlFor="discovery-email" className="sr-only">
              Email address
            </label>
            <input
              id="discovery-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="Your email address"
              className={styles.input}
              disabled={state === 'sending'}
            />
            <button className={`btn btn--ink ${styles.submit}`} type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Tell me first'}
            </button>
          </form>
          <p className={`${styles.msg} ${state === 'error' ? styles.err : ''}`} role="status" aria-live="polite">
            {msg}
          </p>
          <p className={styles.small}>Buying a bottle? {vials.body}</p>
        </div>
      </div>
    </section>
  )
}
