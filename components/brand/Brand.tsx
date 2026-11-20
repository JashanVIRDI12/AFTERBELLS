import { WORDMARK } from './paths'
import styles from './Brand.module.css'

type MarkProps = { className?: string; title?: string; style?: React.CSSProperties }

/** "AFTER BELLS" — vector wordmark, inherits currentColor. */
export function Wordmark({ className, title = 'After Bells', style }: MarkProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox={WORDMARK.viewBox}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      <path d={WORDMARK.d} />
    </svg>
  )
}

type MaskProps = MarkProps & {
  /** 'gold' paints the brand gradient, 'current' uses currentColor */
  tone?: 'gold' | 'current'
  shine?: boolean
}

/** The full peacock-mandala emblem, painted through a CSS mask so it can take gradients. */
export function Emblem({ className = '', tone = 'gold', shine = false, style }: MaskProps) {
  return (
    <span
      aria-hidden
      className={`${styles.mask} ${styles.emblem} ${tone === 'gold' ? styles.gold : styles.current} ${shine ? styles.shine : ''} ${className}`}
      style={style}
    />
  )
}

/** Just the peacock from the centre of the emblem. */
export function Peacock({ className = '', tone = 'gold', shine = false, style }: MaskProps) {
  return (
    <span
      aria-hidden
      className={`${styles.mask} ${styles.peacock} ${tone === 'gold' ? styles.gold : styles.current} ${shine ? styles.shine : ''} ${className}`}
      style={style}
    />
  )
}

/** line ◆ line */
export function Divider({ className = '' }: { className?: string }) {
  return (
    <span className={`divider ${className}`} aria-hidden>
      <i />
    </span>
  )
}
