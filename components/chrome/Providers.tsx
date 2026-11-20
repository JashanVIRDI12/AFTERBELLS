'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'
import { useCart, useUI } from '@/lib/stores'
import { track } from '@/lib/track'

const LenisContext = createContext<Lenis | null>(null)
export const useLenis = () => useContext(LenisContext)

export default function Providers({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const pathname = usePathname()
  const set = useUI((s) => s.set)
  const overlayOpen = useUI((s) => s.menuOpen || s.cartOpen)

  // Smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -40 } })
    l.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    setLenis(l)
    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
    }
  }, [])

  // The persisted bag rehydrates after mount (avoids hydration mismatches).
  useEffect(() => {
    void useCart.persist.rehydrate()
    set({ hydrated: true })
  }, [set])

  // Lock scroll while an overlay is open.
  useEffect(() => {
    if (overlayOpen) {
      lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
    } else {
      lenis?.start()
      document.documentElement.style.overflow = ''
    }
  }, [overlayOpen, lenis])

  // New page: jump to top, close overlays, re-measure triggers.
  useEffect(() => {
    set({ menuOpen: false, cartOpen: false })
    if (!window.location.hash) {
      lenis?.scrollTo(0, { immediate: true, force: true })
      window.scrollTo(0, 0)
    }
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    return () => window.clearTimeout(id)
  }, [pathname, lenis, set])

  // Anonymous measurement: a page view per route, and taps on the concierge's numbers or Instagram.
  useEffect(() => {
    track('page_view')
  }, [pathname])
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a')
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (href.startsWith('tel:')) track('concierge_call')
      else if (href.startsWith('https://wa.me/')) track('concierge_whatsapp')
      else if (href.includes('instagram.com')) track('instagram_click')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Reveal-on-scroll for every [data-reveal] element on the page.
  const io = useRef<IntersectionObserver | null>(null)
  useEffect(() => {
    io.current?.disconnect()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            observer.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    )
    io.current = observer
    const scan = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => observer.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
