'use client'

import { useRef } from 'react'
import styles from './Tilt.module.css'

/** Gentle 3D tilt with a moving metallic sheen — for the gold label & cards. */
export default function Tilt({
  children,
  className = '',
  max = 9,
  sheen = true,
}: {
  children: React.ReactNode
  className?: string
  max?: number
  sheen?: boolean
}) {
  const el = useRef<HTMLDivElement>(null)

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const node = el.current
    if (!node) return
    const r = node.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    node.style.setProperty('--rx', `${(0.5 - py) * max}deg`)
    node.style.setProperty('--ry', `${(px - 0.5) * max}deg`)
    node.style.setProperty('--sx', `${px * 100}%`)
    node.style.setProperty('--sy', `${py * 100}%`)
    node.dataset.active = 'true'
  }
  const leave = () => {
    const node = el.current
    if (!node) return
    node.style.setProperty('--rx', '0deg')
    node.style.setProperty('--ry', '0deg')
    node.dataset.active = 'false'
  }

  return (
    <div ref={el} className={`${styles.tilt} ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div className={styles.body}>
        {children}
        {sheen && <span className={styles.sheen} aria-hidden />}
      </div>
    </div>
  )
}
