import { site, whatsappLink } from '@/lib/site'
import styles from './ConciergeButton.module.css'

/** WhatsApp's own mark, drawn in the house line: an open bubble around a solid handset. */
const WhatsApp = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden className={styles.icon}>
    <path
      d="M12 3.6a8.4 8.4 0 0 0-7.27 12.6L3.6 20.4l4.3-1.12A8.4 8.4 0 1 0 12 3.6z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path
      d="M9.05 7.9c.2-.42.45-.45.7-.46h.52c.17 0 .38.05.52.37l.66 1.6c.06.16.04.34-.06.48l-.5.62a.38.38 0 0 0-.04.44 6.3 6.3 0 0 0 2.57 2.4.37.37 0 0 0 .44-.06l.63-.7a.42.42 0 0 1 .5-.1l1.52.73c.24.11.34.3.32.53-.06.88-.75 1.62-1.66 1.74-1.33.18-2.98-.42-4.57-2-1.62-1.6-2.27-3.22-2.1-4.47.04-.31.13-.6.25-.84z"
      fill="currentColor"
    />
  </svg>
)

const LABEL = 'Connect to concierge'

type Props = {
  /** 'button': outlined button (with the call line beneath unless caption={false}) · 'link': a quiet text line */
  variant?: 'button' | 'link'
  block?: boolean
  className?: string
  /** What the guest is looking at, so the first WhatsApp message is already typed */
  about?: string
  /** Show "On WhatsApp, or call …" under the button. Turn off when a row of buttons sets it once beneath. */
  caption?: boolean
}

const waFor = (about?: string) =>
  whatsappLink(about ? `Hello After Bells, I have a question about ${about}.` : 'Hello After Bells, I have a question.')

/** "On WhatsApp, or call +91 …": the second way in, set once under a row of buttons. */
export function ConciergeCaption({ className = '' }: { className?: string }) {
  const c = site.concierge[0]
  return (
    <p className={`${styles.caption} ${className}`}>
      On WhatsApp, or call <a href={`tel:${c.tel}`}>{c.display}</a>
    </p>
  )
}

/**
 * A WhatsApp conversation with the house, with a phone call as the second way in.
 * Offered beside "Add to bag", the way the great maisons offer an advisor.
 */
export default function ConciergeButton({ variant = 'button', block, className = '', about, caption = true }: Props) {
  const wa = waFor(about)
  if (variant === 'link') {
    return (
      <a href={wa} target="_blank" rel="noopener noreferrer" className={`${styles.link} ${className}`}>
        <WhatsApp />
        {LABEL}
      </a>
    )
  }
  const button = (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn--line ${block ? 'btn--block' : ''} ${styles.btn} ${caption ? '' : className}`}
    >
      <WhatsApp />
      {LABEL}
    </a>
  )
  if (!caption) return button
  return (
    <div className={`${styles.wrap} ${block ? styles.block : ''} ${className}`}>
      {button}
      <ConciergeCaption />
    </div>
  )
}
