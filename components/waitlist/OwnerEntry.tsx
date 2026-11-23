'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import styles from '@/app/waitlist/Waitlist.module.css'

/** "Are you the store owner?" — the password that opens the closed shop (POST /api/preview). */
export default function OwnerEntry({ state }: { state: string }) {
  const [open, setOpen] = useState(state === 'wrong' || state === 'wait')
  if (!open) {
    return (
      <button type="button" className={styles.ownerLink} onClick={() => setOpen(true)}>
        <Lock size={14} strokeWidth={1.5} aria-hidden />
        Are you the store owner? Enter using password
      </button>
    )
  }
  return (
    <form className={styles.owner} method="post" action="/api/preview">
      <label htmlFor="owner-pw">Store password</label>
      <div className={styles.ownerRow}>
        <input id="owner-pw" name="password" type="password" autoComplete="current-password" required autoFocus />
        <button type="submit">Enter</button>
      </div>
      {state === 'wrong' && <p role="alert">That password is not right.</p>}
      {state === 'wait' && <p role="alert">Too many tries. Wait a few minutes and try again.</p>}
    </form>
  )
}
