'use client'

import { useEffect, useState } from 'react'
import { site } from './site'

const closesAt = () => new Date(site.preorder.closes).getTime()

export type Remaining = { d: number; h: number; m: number; s: number; done: boolean }

function remaining(now: number): Remaining {
  const diff = Math.max(0, closesAt() - now)
  const s = Math.floor(diff / 1000)
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: diff <= 0,
  }
}

/** Live countdown to the close of the edition. `null` until mounted (SSR-safe). */
export function useCountdown(): Remaining | null {
  const [r, setR] = useState<Remaining | null>(null)
  useEffect(() => {
    const tick = () => setR(remaining(Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return r
}

/** Assumes open during SSR, corrects on the client. */
export function usePreorderOpen() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const tick = () => setOpen(Date.now() < closesAt())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return open
}

export const pad = (n: number) => String(n).padStart(2, '0')
