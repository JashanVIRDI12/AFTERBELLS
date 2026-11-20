'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/track'
import styles from './TrackForm.module.css'

/** Find an order with its number and the email it was placed with. */
export default function TrackForm() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/order/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ number: fd.get('number'), email: fd.get('email') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      track('track_lookup')
      router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('idle')
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>
        <span>Order number</span>
        <input name="number" required placeholder="AB-1001" autoComplete="off" maxLength={20} />
      </label>
      <label>
        <span>Email used to order</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" maxLength={120} />
      </label>
      <button className="btn btn--gold" disabled={state === 'sending'}>
        {state === 'sending' ? 'Finding…' : 'Find my order'}
      </button>
      <p className={styles.msg} role="status" aria-live="polite">
        {error}
      </p>
      <p className={styles.msg}>
        Or <Link href="/account/orders">sign in to your account</Link> to see every order.
      </p>
    </form>
  )
}
