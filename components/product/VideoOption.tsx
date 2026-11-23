'use client'

import { Check, Video } from 'lucide-react'
import { formatINR } from '@/lib/pricing'
import { site } from '@/lib/site'
import { useUI, useVideo } from '@/lib/stores'
import styles from './VideoOption.module.css'

/** The words for the personalised video, shared by the product page, the bag and checkout. */
export const videoCopy = {
  title: 'Personalised video',
  body: 'A short film from the house, made for you by name and sent on WhatsApp as your bottle leaves.',
}

/** Price, struck through, beside "Complimentary" while the house offers it free. */
export function VideoPrice({ className = '' }: { className?: string }) {
  const { value, complimentary } = site.video
  return (
    <span className={`${styles.price} ${className}`}>
      {complimentary ? (
        <>
          <s aria-label={`Worth ${formatINR(value)}`}>{formatINR(value)}</s>
          <b>Complimentary</b>
        </>
      ) : (
        <b>{formatINR(value)}</b>
      )}
    </span>
  )
}

/** "Personalised video" on a 60 ml page: ticked by default, remembered through to checkout. */
export default function VideoOption({ className = '' }: { className?: string }) {
  const on = useVideo((s) => s.on)
  const setOn = useVideo((s) => s.setOn)
  const hydrated = useUI((s) => s.hydrated)
  const checked = hydrated ? on : true
  return (
    <label className={`${styles.option} ${checked ? styles.on : ''} ${className}`}>
      <input type="checkbox" checked={checked} onChange={(e) => setOn(e.target.checked)} />
      <span className={styles.box} aria-hidden>
        <Check size={14} strokeWidth={2.2} />
      </span>
      <span className={styles.text}>
        <span className={styles.head}>
          <Video className={styles.icon} size={18} strokeWidth={1.4} aria-hidden />
          {videoCopy.title}
          <VideoPrice />
        </span>
        <small>{videoCopy.body}</small>
      </span>
    </label>
  )
}
