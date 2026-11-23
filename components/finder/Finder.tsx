'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { fragrances, travelFragrances } from '@/lib/catalog'
import { FINDER_USED, finderQuestions, finderWhy, matchHour, type HourSlug } from '@/lib/finder'
import { formatINR } from '@/lib/pricing'
import { track } from '@/lib/track'
import { isKnown } from '@/lib/leads'
import ReserveButton from '@/components/ui/ReserveButton'
import ContactCapture from '@/components/lead/ContactCapture'
import styles from './Finder.module.css'

const SAVED = 'ab-hour'

/** Remember the match in this browser, so the house does not ask twice. */
export function savedHour(): HourSlug | null {
  try {
    const v = localStorage.getItem(SAVED)
    return v === 'amber-hour' || v === 'open-sky' || v === 'iron-crown' ? v : null
  } catch {
    return null
  }
}

type Props = {
  /** 'section' sits on a page; 'dialog' lives in the pop-up and starts with an invitation */
  mode?: 'section' | 'dialog'
  /** called when the guest adds the match to their bag (the pop-up closes itself) */
  onAdded?: () => void
  /** the pop-up's "no thank you" */
  onDismiss?: () => void
  titleId?: string
}

/** "Which hour is yours?" — three taps to a match, then the bottle, the price and a way to keep it. */
export default function Finder({ mode = 'section', onAdded, onDismiss, titleId = 'finder-title' }: Props) {
  const [step, setStep] = useState(mode === 'dialog' ? -1 : 0)
  const [picks, setPicks] = useState<HourSlug[]>([])
  const [known, setKnown] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const done = step >= finderQuestions.length
  const match = done ? fragrances.find((f) => f.slug === matchHour(picks)) : undefined
  const travel = match && travelFragrances.find((t) => t.parentSlug === match.slug)

  useEffect(() => setKnown(isKnown()), [])

  // keep the new step in view and announce it to screen readers by moving focus to its heading
  useEffect(() => {
    if (step < 0 || (mode === 'section' && step === 0 && !picks.length)) return
    const h = stage.current?.querySelector<HTMLElement>('[data-step-title]')
    h?.focus({ preventScroll: mode === 'dialog' })
    if (mode === 'section' && stage.current) {
      const top = stage.current.getBoundingClientRect().top
      if (top < 0 || top > innerHeight * 0.4) stage.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [step, mode, picks.length])

  const answer = (hour: HourSlug) => {
    if (step === 0) {
      track('finder_start')
      try {
        sessionStorage.setItem(FINDER_USED, '1')
      } catch {}
    }
    const next = [...picks.slice(0, step), hour]
    setPicks(next)
    setStep(step + 1)
    if (step + 1 === finderQuestions.length) {
      const slug = matchHour(next)
      track('finder_result', { slug })
      try {
        localStorage.setItem(SAVED, slug)
      } catch {}
    }
  }

  const restart = () => {
    setPicks([])
    setStep(0)
  }

  return (
    <div ref={stage} className={`${styles.finder} ${mode === 'dialog' ? styles.inDialog : ''}`}>
      {step === -1 && (
        <div className={styles.intro}>
          <p className="t-eyebrow">Find your hour</p>
          <h2 id={titleId} className={`t-title ${styles.title}`} tabIndex={-1} data-step-title data-autofocus>
            Not sure which <span className="gold-text">to choose?</span>
          </h2>
          <p className={styles.lede}>Three quick questions. We will match you to one of the three perfumes.</p>
          <button type="button" className="btn btn--gold btn--block" onClick={() => setStep(0)}>
            Find my hour
          </button>
          {onDismiss && (
            <button type="button" className={styles.later} onClick={onDismiss}>
              No thank you
            </button>
          )}
        </div>
      )}

      {step >= 0 && !done && (
        <div className={styles.question} key={step}>
          <div className={styles.progress} aria-hidden>
            {finderQuestions.map((q, i) => (
              <span key={q.no} className={i <= step ? styles.lit : ''} />
            ))}
          </div>
          <p className={styles.count}>
            Question {finderQuestions[step].no} <span>of III</span>
          </p>
          <h3 id={step === 0 && mode === 'section' ? undefined : titleId} className={`t-title ${styles.q}`} tabIndex={-1} data-step-title>
            {finderQuestions[step].q}
          </h3>
          <ul className={styles.answers}>
            {finderQuestions[step].answers.map((a) => (
              <li key={a.label}>
                <button type="button" className={`${styles.answer} ${picks[step] === a.hour ? styles.picked : ''}`} onClick={() => answer(a.hour)}>
                  <span>{a.label}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                    <path d="M4 12h15M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          {step > 0 && (
            <button type="button" className={styles.back} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
        </div>
      )}

      {match && (
        <div className={styles.result}>
          <div className={styles.photo} style={{ '--bg': match.theme.bg, '--bg2': match.theme.bg2 } as React.CSSProperties}>
            <Image src={match.image} alt={`${match.name} by After Bells`} fill sizes="(max-width: 700px) 40vw, 260px" />
          </div>
          <div className={styles.copy}>
            <p className="t-eyebrow">Your hour</p>
            <h3 id={titleId} className={`t-title ${styles.name}`} tabIndex={-1} data-step-title>
              {match.name}
            </h3>
            <p className={styles.why}>{finderWhy[match.slug as HourSlug]}</p>
            <p className={styles.notes}>{match.keyNotes.join(' · ')}</p>
          </div>
          <div className={styles.buy}>
            <ReserveButton variantId={match.variants[0].id} price={match.variants[0].price} block openBag onAdded={onAdded} />
            <p className={styles.alt}>
              {travel && (
                <Link href={`/fragrances/${travel.slug}`} onClick={onAdded}>
                  Or the 15 ml · {formatINR(travel.variants[0].price)}
                </Link>
              )}
              <Link href={`/fragrances/${match.slug}`} onClick={onAdded}>
                Read the notes
              </Link>
              <button type="button" onClick={restart}>
                Start again
              </button>
            </p>
          </div>
          {!known && (
            <div className={styles.keep}>
              <p className={styles.keepTitle}>Keep your match</p>
              <ContactCapture
                kind="finder"
                about={match.slug}
                cta="Send it"
                note="We send your match once. The concierge may message you a single time to help you choose. No spam."
                thanks={(via) => (via === 'email' ? 'Sent. Look for it in your inbox.' : 'Thank you. The concierge will message you on WhatsApp.')}
                salonOption
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
