'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Wordmark } from '@/components/brand/Brand'
import { useCart, useUI } from '@/lib/stores'
import Menu from './Menu'
import styles from './Header.module.css'

const NAV = [
  { href: '/collection', label: 'Collection' },
  { href: '/house', label: 'The House' },
]

export default function Header() {
  const pathname = usePathname()
  const { menuOpen, cartOpen, hydrated, set } = useUI()
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0))
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const last = useRef(0)
  const checkout = pathname.startsWith('/checkout')

  useEffect(() => {
    let raf = 0
    const probe = () => {
      raf = 0
      const y = window.scrollY
      const probeY = 34
      let t: 'light' | 'dark' = 'light'
      const sections = document.querySelectorAll<HTMLElement>('[data-header]')
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        if (r.top <= probeY && r.bottom > probeY) {
          t = s.dataset.header === 'dark' ? 'dark' : 'light'
        }
      }
      setTheme(t)
      setSolid(y > 40)
      const delta = y - last.current
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 240)
        last.current = y
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(probe)
    }
    probe()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  const effectiveTheme = menuOpen ? 'dark' : theme

  return (
    <>
      <header
        className={`${styles.header} ${hidden && !menuOpen && !cartOpen ? styles.hidden : ''} ${solid && !menuOpen ? styles.solid : ''}`}
        data-theme={effectiveTheme}
      >
        <div className={styles.inner}>
          <div className={styles.left}>
            {!checkout && (
              <button
                className={styles.menuBtn}
                onClick={() => set({ menuOpen: !menuOpen, cartOpen: false })}
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                <span className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`} aria-hidden>
                  <i />
                  <i />
                </span>
                <span className={styles.menuLabel}>{menuOpen ? 'Close' : 'Menu'}</span>
              </button>
            )}
            {!checkout && (
              <nav className={styles.nav} aria-label="Primary">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className={styles.navLink}>
                    {n.label}
                  </Link>
                ))}
              </nav>
            )}
            {checkout && (
              <Link href="/" className={styles.back}>
                <span aria-hidden>←</span> Continue browsing
              </Link>
            )}
          </div>

          <Link href="/" className={styles.logo} aria-label="After Bells — home">
            <Wordmark />
          </Link>

          <div className={styles.right}>
            {checkout ? (
              <span className={styles.secure}>
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                  <path
                    d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
                Secure
              </span>
            ) : (
              <>
                <Link href="/account" className={styles.account} aria-label="Your account">
                  <svg className={styles.accountIcon} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                    <path
                      d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                </Link>
                <button
                  className={styles.bag}
                  onClick={() => set({ cartOpen: true, menuOpen: false })}
                  aria-label={`Open bag, ${hydrated ? count : 0} items`}
                >
                  <svg className={styles.bagIcon} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                    <path
                      d="M5.5 8.5h13l-1 12h-11zM9 8.5V7a3 3 0 0 1 6 0v1.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <span className={`${styles.count} ${hydrated && count > 0 ? styles.countOn : ''}`}>
                    {hydrated ? count : 0}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <Menu />
    </>
  )
}
