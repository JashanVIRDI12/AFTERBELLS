import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { slots, type ResolvedMedia } from './media'

const IMAGE_EXT = ['.avif', '.webp', '.jpg', '.jpeg', '.png']
const VIDEO_EXT = ['.mp4', '.webm']

const dir = path.join(process.cwd(), 'public', 'media')

function find(slot: string, kind: 'image' | 'video'): string | null {
  for (const ext of kind === 'video' ? VIDEO_EXT : IMAGE_EXT) {
    const file = path.join(dir, slot + ext)
    if (fs.existsSync(file)) {
      const v = Math.floor(fs.statSync(file).mtimeMs).toString(36)
      return `/media/${slot}${ext}?v=${v}`
    }
  }
  return null
}

/** Looks for /public/media/<slot>.<ext>. Runs at build time for static pages. */
export function getMedia(slot: string): ResolvedMedia {
  const def = slots[slot]
  if (!def) throw new Error(`Unknown media slot "${slot}"`)
  const own = find(slot, def.kind)
  const borrowed = !own && def.fallback ? find(def.fallback, def.kind) : null
  // a borrowed photograph keeps its own description
  const alt = borrowed && def.fallback ? (slots[def.fallback]?.alt ?? def.alt) : def.alt
  return { slot, kind: def.kind, src: own ?? borrowed, brief: def.brief, ratio: def.ratio, alt, ...(own && def.focus ? { focus: def.focus } : {}) }
}

export function getMediaMap(names: string[]): Record<string, ResolvedMedia> {
  return Object.fromEntries(names.map((n) => [n, getMedia(n)]))
}
