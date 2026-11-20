'use client'

import { useEffect, useRef } from 'react'
import styles from './GoldFlakes.module.css'

type Props = {
  className?: string
  /** flakes per 100k px² — scaled to the canvas area */
  density?: number
  /** overall drift speed multiplier */
  speed?: number
  /** max flake radius in CSS px */
  size?: number
  /** react to the pointer like liquid being stirred */
  interactive?: boolean
}

type Flake = {
  x: number
  y: number
  r: number
  pts: [number, number][]
  rot: number
  vr: number
  flip: number
  vf: number
  vx: number
  vy: number
  /** the speed it relaxes back to after being stirred */
  vb: number
  sway: number
  phase: number
  depth: number
}

/**
 * 24k gold flakes drifting in liquid — the signature of every After Bells bottle.
 * Lightweight 2D canvas; pauses off-screen and when the tab is hidden.
 */
export default function GoldFlakes({ className = '', density = 3, speed = 1, size = 7, interactive = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let flakes: Flake[] = []
    let raf = 0
    let visible = true
    let last = performance.now()
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0 }

    const make = (anywhere: boolean): Flake => {
      const depth = Math.random()
      const r = (0.35 + depth * 0.65) * size * (0.5 + Math.random() * 0.6)
      const n = 4 + Math.floor(Math.random() * 3)
      const pts: [number, number][] = []
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.9
        const rr = r * (0.45 + Math.random() * 0.75)
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr * (0.6 + Math.random() * 0.5)])
      }
      const vy = (4 + Math.random() * 10) * (0.4 + depth * 0.8)
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -20 - Math.random() * 60,
        r,
        pts,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.6,
        flip: Math.random() * Math.PI * 2,
        vf: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 6,
        vy,
        vb: vy,
        sway: 6 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        depth,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.round(((w * h) / 100000) * density)
      const count = Math.max(10, Math.min(140, target))
      flakes = Array.from({ length: count }, () => make(true)).sort((a, b) => a.depth - b.depth)
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        const face = Math.cos(f.flip) // -1..1 — how much of the flake faces us
        const glint = Math.pow(Math.max(0, face), 18) // sharp sparkle when flat to the light
        const sx = 0.25 + Math.abs(face) * 0.75
        ctx.save()
        ctx.translate(f.x + Math.sin(t * 0.0004 + f.phase) * f.sway, f.y)
        ctx.rotate(f.rot)
        ctx.scale(1, sx)
        const g = ctx.createLinearGradient(-f.r, -f.r, f.r, f.r)
        const a = 0.35 + f.depth * 0.6
        g.addColorStop(0, `rgba(240, 214, 140, ${a})`)
        g.addColorStop(0.5, `rgba(222, 188, 104, ${a})`)
        g.addColorStop(1, `rgba(172, 128, 40, ${a})`)
        ctx.fillStyle = g
        ctx.beginPath()
        f.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
        ctx.closePath()
        ctx.fill()
        if (glint > 0.02) {
          ctx.globalCompositeOperation = 'lighter'
          ctx.fillStyle = `rgba(255, 244, 205, ${glint * 0.9})`
          ctx.fill()
          ctx.globalCompositeOperation = 'source-over'
        }
        ctx.restore()
        if (glint > 0.4 && f.depth > 0.55) {
          // tiny star flare on the brightest flakes
          const cx = f.x + Math.sin(t * 0.0004 + f.phase) * f.sway
          const s = f.r * 2.4 * glint
          const rg = ctx.createRadialGradient(cx, f.y, 0, cx, f.y, s)
          rg.addColorStop(0, `rgba(255, 246, 214, ${0.55 * glint})`)
          rg.addColorStop(1, 'rgba(255, 246, 214, 0)')
          ctx.fillStyle = rg
          ctx.fillRect(cx - s, f.y - s, s * 2, s * 2)
        }
      }
    }

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(0.05, (now - last) / 1000) * speed
      last = now
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i]
        if (interactive) {
          const dx = f.x - pointer.x
          const dy = f.y - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < 22000) {
            const k = (1 - d2 / 22000) * 0.06
            f.vx += pointer.vx * k + (dx / Math.sqrt(d2 + 1)) * 14 * k
            f.vy += pointer.vy * k * 0.6
            f.vf += 0.05
          }
        }
        f.vx *= 0.985
        f.vy += (f.vb - f.vy) * 0.02
        f.vf += (1.1 - f.vf) * 0.01
        f.x += f.vx * dt
        f.y += f.vy * dt
        f.rot += f.vr * dt
        f.flip += f.vf * dt
        if (f.y - f.r > h + 30 || f.x < -60 || f.x > w + 60) {
          flakes[i] = make(false)
          flakes[i].depth = f.depth
        }
      }
      pointer.vx *= 0.9
      pointer.vy *= 0.9
      draw(now)
    }

    const start = () => {
      if (raf || reduce) return
      last = performance.now()
      raf = requestAnimationFrame(step)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    resize()
    draw(performance.now())
    if (!reduce) start()

    const ro = new ResizeObserver(() => {
      resize()
      draw(performance.now())
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !document.hidden) start()
      else stop()
    })
    io.observe(canvas)
    const onVis = () => (document.hidden || !visible ? stop() : start())
    document.addEventListener('visibilitychange', onVis)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (pointer.x > -9000) {
        pointer.vx = (x - pointer.x) * 6
        pointer.vy = (y - pointer.y) * 6
      }
      pointer.x = x
      pointer.y = y
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) onMove({ clientX: t.clientX, clientY: t.clientY } as PointerEvent)
    }
    if (interactive) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('touchmove', onTouch, { passive: true })
    }

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [density, speed, size, interactive])

  return <canvas ref={ref} className={`${styles.canvas} ${className}`} aria-hidden />
}
