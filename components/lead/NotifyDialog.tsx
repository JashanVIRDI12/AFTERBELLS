'use client'

import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDialogFocus } from '@/lib/useDialogFocus'
import ContactCapture from './ContactCapture'
import styles from './Popup.module.css'

/** A fully reserved fragrance: the guest leaves a number or email to hear first if one returns. */
export default function NotifyDialog({ open, onClose, variantId, name }: { open: boolean; onClose: () => void; variantId: string; name: string }) {
  const sheet = useRef<HTMLDivElement>(null)
  useDialogFocus(open, sheet, onClose)
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className={styles.wrap}>
      <div className={styles.scrim} onClick={onClose} aria-hidden />
      <div ref={sheet} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="notify-title" tabIndex={-1}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <div className={styles.body}>
          <p className="t-eyebrow">Fully reserved</p>
          <h2 id="notify-title" className={`t-title ${styles.title}`} tabIndex={-1} data-autofocus>
            {name}
          </h2>
          <p className={styles.lede}>Every bottle is spoken for. We will tell you first if one returns, or when the next edition opens.</p>
          <ContactCapture
            kind="notify"
            about={variantId}
            cta="Notify me"
            note="One message when it is available. Nothing else unless you ask."
            thanks={() => 'Thank you. You will hear first.'}
            salonOption
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
