'use client'

import { site } from '@/lib/site'
import { useStock } from '@/lib/useStock'
import styles from './EditionMeter.module.css'

type Props = {
  variantId: string
  className?: string
  compact?: boolean
  /** Say nothing while the edition is simply open; speak only at "Few remaining" or "Fully reserved". */
  quiet?: boolean
}

/**
 * Edition status in words, never in numbers: "First Edition · Available".
 * Live order data still drives it: "Few remaining" near the end, "Fully reserved" at the end.
 */
export default function EditionMeter({ variantId, className = '', compact, quiet }: Props) {
  const s = useStock(variantId)
  const share = s ? s.remaining / s.edition : 1
  const soldOut = s?.remaining === 0
  const low = Boolean(s) && !soldOut && share <= site.edition.lowStockShare

  const status = soldOut ? 'Fully reserved' : low ? 'Few remaining' : 'Available'
  if (quiet && !low && !soldOut) return null

  return (
    <p
      className={`${styles.meter} ${compact ? styles.compact : ''} ${low ? styles.low : ''} ${soldOut ? styles.out : ''} ${className}`}
    >
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>
        {site.edition.name}
      </span>
      <span className={styles.sep} aria-hidden />
      <span className={styles.status} aria-live="polite">
        {status}
      </span>
    </p>
  )
}
