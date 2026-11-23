'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useDialogFocus } from '@/lib/useDialogFocus'
import { fragrances } from '@/lib/catalog'
import { site } from '@/lib/site'
import { useUI } from '@/lib/stores'
import { Emblem } from '@/components/brand/Brand'
import ConciergeButton from '@/components/ui/ConciergeButton'
import styles from './Menu.module.css'

const SECONDARY = [
  { href: '/collection', label: 'The Collection' },
  { href: '/collection#15ml', label: '15 ml & the gift set' },
  { href: '/collection#find-your-hour', label: 'Find your hour' },
  { href: '/house', label: 'The House' },
  { href: '/account', label: 'Your account' },
  { href: '/client-care#track', label: 'Track your order' },
  { href: '/client-care', label: 'Client care' },
]

export default function Menu() {
  const open = useUI((s) => s.menuOpen)
  const set = useUI((s) => s.set)
  const panel = useRef<HTMLDivElement>(null)

  useDialogFocus(open, panel, () => set({ menuOpen: false }))

  const close = () => set({ menuOpen: false })

  return (
    <div
      id="site-menu"
      ref={panel}
      className={`${styles.menu} ${open ? styles.open : ''}`}
      aria-hidden={!open}
      inert={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Explore After Bells"
      data-lenis-prevent
    >
      <button className={styles.close} onClick={close} aria-label="Close menu">Close <span aria-hidden>×</span></button>
      <Emblem className={styles.emblem} tone="gold" shine />
      <div className={styles.body}>
        <p className={`t-eyebrow ${styles.kicker}`}>Maison de Parfum · The {site.edition.name}</p>
        <ul className={styles.primary}>
          {fragrances.map((f, i) => (
            <li key={f.slug} style={{ '--i': i } as React.CSSProperties}>
              <Link href={`/fragrances/${f.slug}`} onClick={close} className={styles.pLink}>
                <span className={styles.no}>{f.no}</span>
                <span className={`t-name ${styles.name}`}>{f.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className={styles.secondary}>
          {SECONDARY.map((l, i) => (
            <li key={l.href} style={{ '--i': i + 4 } as React.CSSProperties}>
              <Link href={l.href} onClick={close}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.foot}>
        <ConciergeButton variant="link" />
        <div className={styles.footEnd}>
          <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer" className="link">
            @{site.instagram}
          </a>
        </div>
      </div>
    </div>
  )
}
