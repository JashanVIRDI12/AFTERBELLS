'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { ResolvedMedia } from '@/lib/media'
import type { Theme } from '@/lib/catalog'
import { site } from '@/lib/site'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'
import { Peacock } from '@/components/brand/Brand'
import styles from './MediaSlot.module.css'

type Props = {
  media: ResolvedMedia
  theme?: Pick<Theme, 'bg' | 'bg2' | 'accent' | 'tone'>
  /** Gold label artwork shown in the empty frame, e.g. '/brand/labels/amber-hour.webp' */
  label?: string
  className?: string
  sizes?: string
  quality?: 75 | 85 | 92
  priority?: boolean
  /** Subtle vertical drift of the image inside its frame while scrolling */
  parallax?: boolean
  /**
   * How the frame arrives when it enters the viewport:
   * true — a clip-path wipe from below · 'focus' — rises from below behind a soft feathered edge, sharpening into focus · false — no entrance
   */
  reveal?: boolean | 'focus'
  /** Hide the empty-slot hint (e.g. tiny thumbnails) */
  quiet?: boolean
  /** Background video options */
  autoPlay?: boolean
  poster?: string | null
  /** Where the empty-slot hint sits */
  hintAt?: 'bottom' | 'top'
  /** Isolated bottle on the section background, with no image frame. */
  transparent?: boolean
}

const defaultTheme = { bg: '#2a211a', bg2: '#4a3a2a', accent: '#d7b25e', tone: 'dark' as const }

export default function MediaSlot({
  media,
  theme = defaultTheme,
  label,
  className = '',
  sizes = '100vw',
  quality = 85,
  priority,
  parallax,
  reveal = true,
  quiet,
  autoPlay = true,
  poster,
  hintAt = 'bottom',
  transparent = false,
}: Props) {
  const root = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) {
      el?.classList.add(styles.in)
      return
    }
    const ctx = gsap.context(() => {
      if (reveal) {
        ScrollTrigger.create({
          trigger: el,
          // the soft rise plays once most of the frame is in view, so the eye sees it arrive
          start: reveal === 'focus' ? 'top 72%' : 'top 92%',
          once: true,
          onEnter: () => el.classList.add(styles.in),
        })
      } else {
        el.classList.add(styles.in)
      }
      if (parallax && inner.current) {
        gsap.fromTo(
          inner.current,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      }
    }, el)
    return () => ctx.revert()
  }, [parallax, reveal])

  const vars = {
    '--m-bg': theme.bg,
    '--m-bg2': theme.bg2,
    '--m-accent': theme.accent,
  } as React.CSSProperties

  const empty = !media.src
  const ext = media.kind === 'video' ? 'mp4' : 'jpg'

  return (
    <div
      ref={root}
      className={`${styles.frame} ${transparent ? styles.transparent : ''} ${reveal === 'focus' ? styles.focus : reveal ? styles.reveal : ''} ${empty ? styles.empty : ''} ${theme.tone === 'light' ? styles.light : ''} ${className}`}
      style={vars}
    >
      <div ref={inner} className={`${styles.inner} ${parallax ? styles.parallax : ''}`}>
        <div className={styles.zoom}>
        {media.src && media.kind === 'image' && (
          <Image
            src={media.src}
            alt={media.alt}
            fill
            sizes={sizes}
            preload={priority}
            quality={quality}
            className={styles.img}
          />
        )}
        {media.src && media.kind === 'video' && (
          <video
            className={styles.img}
            src={media.src}
            poster={poster ?? undefined}
            muted
            loop
            playsInline
            autoPlay={autoPlay}
            preload="metadata"
            aria-label={media.alt}
          />
        )}
        {empty && (
          <div className={styles.placeholder} role="img" aria-label={media.alt}>
            <span className={styles.glow} aria-hidden />
            {label ? (
              <span className={styles.plaque} aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={label} alt="" draggable={false} />
                <span className={styles.sheen} />
              </span>
            ) : media.kind === 'video' ? (
              <span className={styles.play} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </span>
            ) : (
              <Peacock className={styles.peacock} tone="current" />
            )}
          </div>
        )}
        </div>
      </div>
      {empty && <span className={styles.frameLines} aria-hidden />}
      {empty && site.showMediaHints && !quiet && (
        <div className={`${styles.hint} ${hintAt === 'top' ? styles.hintTop : ''}`} aria-hidden>
          <code className={styles.hintFile}>
            {media.kind === 'video' ? 'Film' : 'Image'} {media.ratio} · public/media/{media.slot}.{ext}
          </code>
        </div>
      )}
    </div>
  )
}
