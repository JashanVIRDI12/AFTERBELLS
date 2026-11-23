/**
 * The catalogue. Prices are in rupees, inclusive of taxes (confirmed in the brief).
 *
 * Note pyramids follow each fragrance's reference profile (internal only — the
 * reference houses are deliberately NOT named anywhere on the public site):
 *   Amber Hour  ← Althaïr profile
 *   Open Sky    ← Sur la Route profile
 *   Iron Crown  ← Decision profile
 *
 * STILL TO CONFIRM:
 *   - bottle size: 60 ml for every fragrance (confirmed 18 Nov 2026)
 *   - price: ₹2,500 for every fragrance, inclusive of taxes (confirmed 18 Nov 2026)
 *   - concentration name: 20% perfume oil is shown as 'Eau de Parfum' (some houses call 20%+ 'Extrait')
 *   - final descriptions & story copy (drafts below)
 */

import type { AccordKey } from './accords'

export type Theme = {
  /** Page / card background */
  bg: string
  /** Secondary background (gradients) */
  bg2: string
  /** Text colour on bg */
  ink: string
  /** Accent used for numerals, lines, highlights */
  accent: string
  /** 'dark' backgrounds get light chrome */
  tone: 'dark' | 'light'
}

export type Variant = {
  id: string
  /** Bottle size, e.g. '50 ml'. Leave empty until confirmed — the UI hides it. */
  size: string
  price: number
}

export type Fragrance = {
  slug: string
  no: string
  name: string
  hour: string
  hourLabel: string
  family: string
  /** One plain line for how the scent moves on skin, top to base (the composition headline) */
  arc: string
  concentration: string
  tagline: string
  description: string
  story: string[]
  keyNotes: string[]
  notes: { top: string[]; heart: string[]; base: string[] }
  /** Strongest accord first; value 0–1 sets the bar length */
  accords: { key: AccordKey; value: number }[]
  /** How well it suits each season and time of day, 0–1 (season and sun/moon icons) */
  when: { winter: number; spring: number; summer: number; autumn: number; day: number; night: number }
  character: { left: string; right: string; value: number }[]
  wear: { label: string; value: string }[]
  label: string
  /** Product photography used in the bag, checkout and social previews. */
  image: string
  theme: Theme
  media: string[]
  variants: Variant[]
  format?: 'travel'
  parentSlug?: string
}

/** Shared by every bottle */
export const signature = {
  gold: '24k gold flakes suspended in every bottle',
  label: 'Gold-tone metal front label',
  /** Perfume-oil concentration, shared by every fragrance */
  strength: '20%',
  strengthLabel: '20% perfume oil',
  /** Every composition is universal — made to be worn by anyone */
  wear: 'Universal',
}

export const fragrances: Fragrance[] = [
  {
    slug: 'amber-hour',
    no: 'I',
    name: 'Amber Hour',
    hour: '18:40',
    hourLabel: 'After the evening bells',
    family: 'Amber · Gourmand',
    arc: 'From orange blossom to warm praline',
    concentration: 'Eau de Parfum',
    tagline: 'Dusk, poured slowly.',
    description:
      'The evening bells have rung and the lamps are lit. Orange blossom and cinnamon glow over a heart of bourbon vanilla and elemi, melting into praline, guaiac wood and amber — warmth that lingers long after dusk.',
    story: [
      'There is a moment, just after the evening bells, when the whole city exhales. Lamps flicker on, stone steps still hold the warmth of the day, and everything — for a few minutes — turns the colour of honey.',
      'Amber Hour is that moment, bottled. It opens with orange blossom, bergamot and a curl of cinnamon and cardamom, sinks into bourbon vanilla softened by elemi, then settles on skin as a slow glow of praline, guaiac wood, amber and musk. Flakes of 24k gold drift through it like the last light of the day.',
    ],
    keyNotes: ['Orange Blossom', 'Bourbon Vanilla', 'Praline'],
    notes: {
      top: ['Orange Blossom', 'Bergamot', 'Cinnamon', 'Cardamom'],
      heart: ['Bourbon Vanilla', 'Elemi'],
      base: ['Praline', 'Guaiac Wood', 'Amber', 'Musk'],
    },
    accords: [
      { key: 'vanilla', value: 1 },
      { key: 'sweet', value: 0.86 },
      { key: 'amber', value: 0.78 },
      { key: 'warm spicy', value: 0.66 },
      { key: 'white floral', value: 0.5 },
      { key: 'woody', value: 0.42 },
      { key: 'citrus', value: 0.3 },
    ],
    when: { winter: 1, spring: 0.32, summer: 0.12, autumn: 0.9, day: 0.45, night: 1 },
    character: [
      { left: 'Fresh', right: 'Warm', value: 0.9 },
      { left: 'Dry', right: 'Sweet', value: 0.82 },
      { left: 'Close', right: 'Radiant', value: 0.7 },
    ],
    wear: [
      { label: 'Mood', value: 'Warm, sweet, magnetic' },
      { label: 'Season', value: 'Autumn · Winter' },
      { label: 'Moment', value: 'Evenings, celebrations' },
      { label: 'Signature', value: 'Vanilla · Praline · Amber' },
    ],
    label: '/brand/labels/amber-hour.webp',
    image: '/media/amber-hour-bottle.webp',
    theme: { bg: '#2A1509', bg2: '#5B2D0F', ink: '#F7E8D3', accent: '#E3A452', tone: 'dark' },
    media: ['amber-hour-bottle', 'amber-hour-detail', 'amber-hour-mood'],
    variants: [{ id: 'amber-hour', size: '60 ml', price: 2500 }],
  },
  {
    slug: 'open-sky',
    no: 'II',
    name: 'Open Sky',
    hour: '06:10',
    hourLabel: 'After the morning bells',
    family: 'Citrus · Aromatic',
    arc: 'From citrus peel to dry cedar',
    concentration: 'Eau de Parfum',
    tagline: 'The first breath of morning.',
    description:
      'The morning bells fade into an open road. Citron, bergamot and pink pepper burst bright; sage, nutmeg and fresh-cut grass ride the breeze; cedar, vetiver and a whisper of soft leather keep it close all day.',
    story: [
      'Before the city wakes there is an hour that belongs to the sky. The bells ring once, the road is empty, and the air is so clean it feels like the start of everything.',
      'Open Sky captures that freedom. Sun-bright citron, bergamot and lemon sparkle over pink pepper; clary sage, nutmeg and cut grass give it the feel of wind through an open window; a dry trail of cedar, vetiver, patchouli and soft leather carries it from morning into night.',
    ],
    keyNotes: ['Citron', 'Sage', 'Cedarwood'],
    notes: {
      top: ['Citron', 'Bergamot', 'Lemon', 'Pink Pepper'],
      heart: ['Clary Sage', 'Nutmeg', 'Cardamom', 'Cut Grass'],
      base: ['Cedarwood', 'Vetiver', 'Patchouli', 'Soft Leather'],
    },
    accords: [
      { key: 'citrus', value: 1 },
      { key: 'aromatic', value: 0.86 },
      { key: 'fresh spicy', value: 0.7 },
      { key: 'woody', value: 0.6 },
      { key: 'green', value: 0.5 },
      { key: 'earthy', value: 0.4 },
      { key: 'leather', value: 0.3 },
    ],
    when: { winter: 0.22, spring: 1, summer: 0.96, autumn: 0.5, day: 1, night: 0.38 },
    character: [
      { left: 'Fresh', right: 'Warm', value: 0.16 },
      { left: 'Dry', right: 'Sweet', value: 0.24 },
      { left: 'Close', right: 'Radiant', value: 0.74 },
    ],
    wear: [
      { label: 'Mood', value: 'Bright, clean, free' },
      { label: 'Season', value: 'Spring · Summer' },
      { label: 'Moment', value: 'Mornings, every day, travel' },
      { label: 'Signature', value: 'Citrus · Sage · Cedar' },
    ],
    label: '/brand/labels/open-sky.webp',
    image: '/media/open-sky-bottle.webp',
    theme: { bg: '#DCE4E5', bg2: '#AFC3CC', ink: '#1C272D', accent: '#4F7286', tone: 'light' },
    media: ['open-sky-bottle', 'open-sky-detail', 'open-sky-mood'],
    variants: [{ id: 'open-sky', size: '60 ml', price: 2500 }],
  },
  {
    slug: 'iron-crown',
    no: 'III',
    name: 'Iron Crown',
    hour: '00:00',
    hourLabel: 'After the midnight bell',
    family: 'Incense · Woody',
    arc: 'From bright spice to incense smoke',
    concentration: 'Eau de Parfum',
    tagline: 'Authority, without a word.',
    description:
      'When the last bell falls silent, the smoke rises. Bergamot, cardamom and pink pepper open onto a temple heart of frankincense, myrrh and juniper, crowned with vanilla, Atlas cedar and patchouli.',
    story: [
      'Midnight. The final bell rings out over a sleeping city and the temple fills with smoke — frankincense on the coals, myrrh in the air, cedar beams overhead.',
      'Iron Crown is composed for those who never need to raise their voice. Bergamot, cardamom and pink pepper give it a sharp, confident edge before a smoky, balsamic heart of frankincense, myrrh and juniper takes over, resting on vanilla, Atlas cedar and patchouli until morning.',
    ],
    keyNotes: ['Frankincense', 'Myrrh', 'Atlas Cedar'],
    notes: {
      top: ['Bergamot', 'Cardamom', 'Pink Pepper'],
      heart: ['Frankincense', 'Myrrh', 'Juniper Berry'],
      base: ['Vanilla', 'Atlas Cedar', 'Patchouli'],
    },
    accords: [
      { key: 'incense', value: 1 },
      { key: 'balsamic', value: 0.84 },
      { key: 'woody', value: 0.74 },
      { key: 'warm spicy', value: 0.58 },
      { key: 'fresh spicy', value: 0.48 },
      { key: 'vanilla', value: 0.4 },
      { key: 'earthy', value: 0.34 },
    ],
    when: { winter: 1, spring: 0.3, summer: 0.1, autumn: 0.94, day: 0.32, night: 1 },
    character: [
      { left: 'Fresh', right: 'Warm', value: 0.74 },
      { left: 'Dry', right: 'Sweet', value: 0.4 },
      { left: 'Close', right: 'Radiant', value: 0.8 },
    ],
    wear: [
      { label: 'Mood', value: 'Smoky, resinous, commanding' },
      { label: 'Season', value: 'Autumn · Winter' },
      { label: 'Moment', value: 'Night, statements' },
      { label: 'Signature', value: 'Frankincense · Myrrh · Cedar' },
    ],
    label: '/brand/labels/iron-crown.webp',
    image: '/media/iron-crown-bottle.webp',
    theme: { bg: '#0E0B08', bg2: '#2A2017', ink: '#F2E8D8', accent: '#D2B26A', tone: 'dark' },
    media: ['iron-crown-bottle', 'iron-crown-detail', 'iron-crown-mood'],
    variants: [{ id: 'iron-crown', size: '60 ml', price: 2500 }],
  },
]

/** The same compositions in the house's slim, capped 15 ml bottle. */
export const travelFragrances: Fragrance[] = fragrances.map((f) => ({
  ...f,
  slug: `${f.slug}-15ml`,
  parentSlug: f.slug,
  format: 'travel',
  image: `/media/${f.slug}-15ml-bottle.webp`,
  media: [`${f.slug}-15ml-bottle`, `${f.slug}-15ml-scene`, `${f.slug}-15ml-detail`],
  variants: [{ id: `${f.slug}-15ml`, size: '15 ml', price: 799 }],
}))

export const allFragrances = [...fragrances, ...travelFragrances]

export type Product = Pick<Fragrance, 'slug' | 'name' | 'concentration' | 'family' | 'image' | 'theme' | 'variants'> & {
  href?: string
  images?: string[]
}

export const giftSet: Product = {
  slug: '15ml-gift-set',
  name: 'The 15 ml Gift Set',
  concentration: 'Eau de Parfum',
  family: 'Amber · Citrus · Incense',
  href: '/gift-set',
  image: travelFragrances[0].image,
  images: travelFragrances.map((f) => f.image),
  theme: fragrances[0].theme,
  variants: [{ id: '15ml-gift-set', size: '3 × 15 ml', price: 2099 }],
}

export const products: Product[] = [...allFragrances, giftSet]

export const productHref = (p: Product) => p.href ?? `/fragrances/${p.slug}`

export function getFragrance(slug: string): Fragrance | undefined {
  return allFragrances.find((f) => f.slug === slug)
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getVariant(variantId: string): { product: Product; variant: Variant } | undefined {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (variant) return { product, variant }
  }
  return undefined
}

export function fromPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price))
}

/** The full-size bottles (60 ml): these come with the personalised video. */
export const isFullSize = (variantId: string) => fragrances.some((f) => f.variants.some((v) => v.id === variantId))
