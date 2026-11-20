'use client'

import styles from './QtyStepper.module.css'

type Props = { value: number; onChange: (n: number) => void; min?: number; max?: number; className?: string }

export default function QtyStepper({ value, onChange, min = 1, max = 3, className = '' }: Props) {
  return (
    <div className={`${styles.stepper} ${className}`} role="group" aria-label="Quantity">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
          <path d="M2 6h8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
          <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  )
}
