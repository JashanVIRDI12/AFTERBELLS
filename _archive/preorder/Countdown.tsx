'use client'

import { pad, useCountdown } from '@/lib/preorder'
import styles from './Countdown.module.css'

type Props = { className?: string; compact?: boolean; large?: boolean }

export default function Countdown({ className = '', compact, large }: Props) {
  const r = useCountdown()

  if (r?.done) {
    return <span className={`${styles.closed} ${className}`}>The edition is closed</span>
  }

  const units: [string, string][] = [
    [r ? pad(r.d) : '––', 'Days'],
    [r ? pad(r.h) : '––', 'Hours'],
    [r ? pad(r.m) : '––', 'Min'],
    [r ? pad(r.s) : '––', 'Sec'],
  ]

  if (compact) {
    return (
      <span className={`${styles.compact} ${className}`} aria-label="Time remaining" role="timer">
        {units.map(([v, u], i) => (
          <span key={u}>
            {v}
            <small>{u[0].toLowerCase()}</small>
            {i < 3 && <span className={styles.sep} />}
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className={`${styles.grid} ${large ? styles.large : ''} ${className}`} role="timer" aria-label="Time remaining">
      {units.map(([v, u]) => (
        <div key={u} className={styles.cell}>
          <span className={styles.value}>{v}</span>
          <span className={styles.unit}>{u}</span>
        </div>
      ))}
    </div>
  )
}
