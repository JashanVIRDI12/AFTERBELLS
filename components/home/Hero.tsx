'use client'

import { useEffect, useRef, useState } from 'react'
import { getImageProps } from 'next/image'
import type { ResolvedMedia } from '@/lib/media'
import { editionPrice } from '@/lib/pricing'
import { site } from '@/lib/site'
import { useUI } from '@/lib/stores'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import styles from './Hero.module.css'

/** Portrait screens (phones, upright tablets) get the 9:16 reel; everything else the 16:9 film. */
export const PORTRAIT = '(max-aspect-ratio: 3/4)'

type Props = { film: ResolvedMedia; poster: ResolvedMedia; filmMobile?: ResolvedMedia; posterMobile?: ResolvedMedia }

export default function Hero({ film, poster, filmMobile, posterMobile }: Props) {
  const root = useRef<HTMLElement>(null)
  // null until mounted: the server can't know the screen, so the video waits for the client
  const [portrait, setPortrait] = useState<boolean | null>(null)
  // a phone in data-saver mode gets the still poster only
  const [lite, setLite] = useState(false)
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setLite(Boolean(c?.saveData))
    const mq = window.matchMedia(PORTRAIT)
    const sync = () => setPortrait(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const useReel = Boolean(portrait && filmMobile?.src)
  const filmSrc = portrait === null || lite ? null : useReel ? filmMobile!.src : film.src
  // the 16:9 film is cut at 10.4s and loops at 10.2s, before its black tail; the reel loops whole
  const loopEnd = useReel ? null : 10.2
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const ready = useUI((s) => s.ready)

  useEffect(() => {
    const v = video.current
    if (!v) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (motion.matches) {
        v.pause()
        v.currentTime = 0
      } else {
        void v.play().catch(() => {})
      }
    }
    sync()
    motion.addEventListener('change', sync)
    return () => motion.removeEventListener('change', sync)
  }, [filmSrc])

  const toggleVideo = () => {
    const v = video.current
    if (!v) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  // Intro — waits for the curtain. Start states live in CSS so nothing flashes before hydration.
  useEffect(() => {
    const el = root.current
    if (!el || !ready) return
    const q = gsap.utils.selector(el)
    if (prefersReducedMotion()) {
      gsap.set(q('[data-line]'), { yPercent: 0 })
      gsap.set(q('[data-fade]'), { opacity: 1, y: 0 })
      gsap.set(q('[data-rule]'), { scaleX: 1 })
      return
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    tl.fromTo(q(`.${styles.media}`), { scale: 1.14 }, { scale: 1, duration: 3 }, 0)
      .fromTo(q('[data-fade="kicker"]'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2 }, 0.1)
      .fromTo(q('[data-line]'), { yPercent: 115, y: 0 }, { yPercent: 0, duration: 1.6, stagger: 0.14 }, 0.2)
      .fromTo(q('[data-rule]'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 0.7)
      .fromTo(q('[data-fade]:not([data-fade="kicker"])'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.09 }, 0.85)
    return () => {
      tl.kill()
    }
  }, [ready])

  // Scroll — the words lift away while the film settles back.
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to(`.${styles.content}`, { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: st })
      gsap.to(`.${styles.parallax}`, { yPercent: 16, scale: 1.06, ease: 'none', scrollTrigger: st })
      gsap.to(`.${styles.veil}`, { opacity: 1, ease: 'none', scrollTrigger: st })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className={styles.hero} data-header="dark" aria-label="Introduction">
      <div className={styles.parallax}>
        <div className={styles.media}>
          {poster.src && <Poster desktop={poster.src} mobile={posterMobile?.src ?? null} />}
          {filmSrc && (
            <video
              key={filmSrc}
              ref={video}
              className={styles.video}
              src={filmSrc}
              poster={(useReel ? posterMobile?.src : poster.src) ?? undefined}
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              data-playing={playing}
              onTimeUpdate={(e) => {
                if (loopEnd && e.currentTarget.currentTime >= loopEnd) e.currentTarget.currentTime = 0
              }}
              aria-hidden
            />
          )}
          <div className={styles.shade} aria-hidden />
        </div>
      </div>
      <div className={styles.veil} aria-hidden />

      <div className={`wrap ${styles.content}`}>
        <p className={`t-eyebrow ${styles.kicker}`} data-fade="kicker">
          Maison de Parfum
        </p>
        <h1 className={`t-title ${styles.title}`}>
          <span className="mask">
            <span data-line>Reserved for</span>
          </span>
          <span className="mask">
            <span data-line>
              the <span className="gold-text gold-text--shine">exceptional.</span>
            </span>
          </span>
        </h1>
        <span className={styles.rule} data-rule aria-hidden />
        <p className={styles.facts} data-fade>
          <span>{site.edition.name}</span>
          <span>{editionPrice().label}</span>
        </p>
        <div className={styles.ctas} data-fade>
          <a href="#collection" className={`btn btn--gold ${styles.cta}`}>
            Shop the collection
            <svg className="arrow" viewBox="0 0 24 24" aria-hidden>
              <path d="M4 12h15M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </a>
        </div>
      </div>

      <div className={`wrap ${styles.bottom}`} data-fade>
        {filmSrc && (
          <button
            className={styles.playback}
            onClick={toggleVideo}
            aria-label={playing ? 'Pause background film' : 'Play background film'}
          >
            {playing ? (
              <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden>
                <path d="M6 4v12M14 4v12" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden>
                <path d="M6 3l11 7-11 7z" fill="currentColor" />
              </svg>
            )}
          </button>
        )}
      </div>
    </section>
  )
}

/** Art-directed poster: 9:16 on portrait screens, 16:9 elsewhere — the right one paints first, before the film. */
function Poster({ desktop, mobile }: { desktop: string; mobile: string | null }) {
  const common = { alt: '', sizes: '100vw', quality: 80 }
  const {
    props: { srcSet: wide, ...rest },
  } = getImageProps({ ...common, src: desktop, width: 1920, height: 1080, loading: 'eager', fetchPriority: 'high' })
  const tall = mobile ? getImageProps({ ...common, src: mobile, width: 1080, height: 1920 }).props.srcSet : null
  return (
    <picture>
      {tall && <source media={PORTRAIT} srcSet={tall} />}
      <source srcSet={wide} />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...rest} className={styles.video} />
    </picture>
  )
}
