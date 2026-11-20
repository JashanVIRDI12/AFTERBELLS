'use client'

import type { Fragrance } from '@/lib/catalog'
import { signature } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { ACCORDS } from '@/lib/accords'
import { formatINR } from '@/lib/pricing'
import Image from 'next/image'
import ReserveButton from '@/components/ui/ReserveButton'
import ConciergeButton from '@/components/ui/ConciergeButton'
import ReserveNote from '@/components/ui/ReserveNote'
import { vials } from '@/lib/content'
import { site } from '@/lib/site'
import EditionMeter from '@/components/ui/EditionMeter'
import { NoteIllustration, WearIllustration } from './CompositionArtwork'
import styles from './Composition.module.css'

const TIERS = [
  { key: 'top', name: 'Top notes', when: 'First minutes' },
  { key: 'heart', name: 'Heart notes', when: 'The hours that follow' },
  { key: 'base', name: 'Base notes', when: 'What remains on skin' },
] as const

const SEASONS = [
  { key: 'winter', label: 'Winter' },
  { key: 'spring', label: 'Spring' },
  { key: 'summer', label: 'Summer' },
  { key: 'autumn', label: 'Autumn' },
] as const

const TIMES = [
  { key: 'day', label: 'Day' },
  { key: 'night', label: 'Night' },
] as const

/** The colour at each end of a character scale */
const TONES: Record<string, string> = {
  Fresh: '#5FB6CB',
  Warm: '#DE8A3C',
  Dry: '#C4A26E',
  Sweet: '#DD5F7E',
  Close: '#B0917F',
  Radiant: '#EDC14E',
}

const verdict = (v: number) => (v >= 0.8 ? 'ideal' : v >= 0.5 ? 'suits it' : 'less suited')
/** "warm, sweet, magnetic" → "Warm, sweet, magnetic" */
const sentence = (v: string) => (v ? v[0].toUpperCase() + v.slice(1) : v)

/**
 * How the perfume unfolds, and whether it is yours:
 * three illustrated note families, when to wear it, its character, then buy.
 */
export default function Composition({ product: f, cutout }: { product: Fragrance; cutout: ResolvedMedia }) {
  const v = f.variants[0]
  const pick = (label: string) => f.wear.find((w) => w.label === label)?.value ?? ''
  const isKey = (n: string) => f.keyNotes.some((k) => n === k || n.endsWith(` ${k}`))

  const vars = {
    '--bg': f.theme.bg,
    '--bg2': f.theme.bg2,
    '--ink': f.theme.ink,
    '--accent': f.theme.accent,
    '--a1': ACCORDS[f.accords[0].key].color,
    '--a2': ACCORDS[f.accords[1].key].color,
    '--a3': ACCORDS[f.accords[2].key].color,
  } as React.CSSProperties

  return (
    <section
      className={`section ${styles.comp} ${f.theme.tone === 'light' ? styles.light : ''}`}
      style={vars} data-header={f.theme.tone} aria-labelledby="comp-title">
      {/* soft lights in the scent's top accord colours, for the glass to frost */}
      <span className={styles.aura} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="comp-title" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.08s' } as React.CSSProperties}>
            {f.arc}
          </h2>
        </header>

        {/* Botanical engravings above each family, like a perfumer's ingredient folio. */}
        <div className={styles.drydown}>
          <ol className={styles.stages}>
            {TIERS.map((t) => {
              const notes = f.notes[t.key]
              const representative = notes.find(isKey) ?? notes[0]
              return (
                <li key={t.key} className={styles.stage} data-reveal>
                  <NoteIllustration note={representative} className={styles.stageIllustration} />
                  <header className={styles.stageHead}>
                    <h3 className={styles.stageName}>{t.name}</h3>
                    <span className={styles.when}>{t.when}</span>
                  </header>
                  <ul className={styles.notes}>
                    {notes.map((n, i) => (
                      <li key={n} className={isKey(n) ? styles.key : undefined}>
                        {n}
                        {isKey(n) && <span className="sr-only"> (key note)</span>}
                        {i < notes.length - 1 && <span className={styles.separator}>, </span>}
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ol>
          <p className={styles.legend}>Key notes in gold</p>
        </div>

        {/* is it yours */}
        <div className={styles.profile} data-reveal>
          <div className={`${styles.glass} ${styles.block} ${styles.wear}`}>
            <p className={`t-eyebrow ${styles.kicker}`}>When to wear</p>
            <ul className={styles.seasons}>
              {SEASONS.map((s, i) => {
                const val = f.when[s.key]
                return (
                  <li key={s.key} className={val >= 0.6 ? styles.on : undefined} style={{ '--v': val, '--i': i } as React.CSSProperties}>
                    <WearIllustration name={s.key} className={styles.wearImage} />
                    <b>{s.label}</b>
                    <span className={styles.meter} role="img" aria-label={`${s.label}: ${verdict(val)}`}>
                      <i />
                    </span>
                  </li>
                )
              })}
            </ul>
            <ul className={styles.times}>
              {TIMES.map((t, i) => {
                const val = f.when[t.key]
                return (
                  <li key={t.key} className={val >= 0.6 ? styles.on : undefined} style={{ '--v': val, '--i': i + 4 } as React.CSSProperties}>
                    <WearIllustration name={t.key} className={styles.wearImage} />
                    <b>{t.label}</b>
                    <span className={styles.meter} role="img" aria-label={`${t.label}: ${verdict(val)}`}>
                      <i />
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className={`${styles.glass} ${styles.block} ${styles.character}`}>
            <p className={`t-eyebrow ${styles.kicker}`}>Character</p>
            <ul>
              {f.character.map((c, i) => {
                const right = c.value >= 0.5
                return (
                  <li
                    key={c.left}
                    style={
                      {
                        '--l': TONES[c.left] ?? 'var(--accent)',
                        '--r': TONES[c.right] ?? 'var(--accent)',
                        '--v': c.value,
                        '--p': `${Math.round(c.value * 100)}%`,
                        '--i': i,
                      } as React.CSSProperties
                    }
                  >
                    <span className={right ? undefined : styles.lead}>{c.left}</span>
                    <span className={styles.track} role="img" aria-label={`${Math.round(c.value * 100)}% towards ${c.right}`}>
                      <span className={styles.knob} />
                    </span>
                    <span className={right ? styles.lead : undefined}>{c.right}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <dl className={`${styles.glass} ${styles.block} ${styles.feel}`}>
            {['Mood', 'Moment'].map((label) => (
              <div key={label}>
                <dt className={`t-eyebrow ${styles.kicker}`}>{label}</dt>
                <dd className={styles.phrase}>
                  {/* lines may only break after a comma, so "every day" stays together */}
                  {sentence(pick(label))
                    .split(', ')
                    .map((part, i, all) => (
                      <span key={part}>
                        {part}
                        {i < all.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* decide here, while the scent is still in mind */}
        <aside className={`heritage ${styles.glass} ${styles.decide}`} aria-label={`Buy ${f.name}`} data-reveal data-own-cta>
          <div className={styles.bottle} aria-hidden>
            <span className={styles.glow} />
            {cutout.src && <Image src={cutout.src} alt="" fill sizes="160px" className={styles.cut} />}
          </div>
          <div className={styles.decideInfo}>
            <EditionMeter variantId={v.id} compact quiet className={styles.edition} />
            <p className={`t-name ${styles.decideName}`}>{f.name}</p>
            <p className={styles.decideSub}>
              {f.family} · {signature.strengthLabel} · {v.size}
            </p>
          </div>
          <ul className={styles.perks}>
            <li>{vials.body}</li>
            <li>Complimentary delivery · next day in {site.delivery.fastPlace}</li>
          </ul>
          <div className={styles.decideBuy}>
            <p className={styles.price}>
              {formatINR(v.price)}
              <small>Inclusive of all taxes</small>
            </p>
            <ReserveButton variantId={v.id} block />
            <ReserveNote />
            <ConciergeButton variant="link" about={f.name} className={styles.ask} />
          </div>
        </aside>
      </div>
    </section>
  )
}
