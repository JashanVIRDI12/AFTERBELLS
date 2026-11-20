'use client'

import { useId, useState } from 'react'
import styles from './Accordion.module.css'

type Item = { q: string; a: React.ReactNode }

export default function Accordion({ items, defaultOpen = -1, className = '' }: { items: Item[]; defaultOpen?: number; className?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className={`${styles.acc} ${className}`}>
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.q} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
            <h3>
              <button
                id={`${id}-b${i}`}
                className={styles.q}
                aria-expanded={isOpen}
                aria-controls={`${id}-p${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{it.q}</span>
                <span className={styles.icon} aria-hidden />
              </button>
            </h3>
            <div id={`${id}-p${i}`} role="region" aria-labelledby={`${id}-b${i}`} aria-hidden={!isOpen} inert={!isOpen} className={styles.panel}>
              <div className={styles.inner}>
                <div className={styles.a}>{it.a}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
