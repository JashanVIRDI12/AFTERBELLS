/**
 * Media slots — every photo / film on the site.
 *
 * To fill a slot, drop a file named after the slot into /public/media/,
 * e.g. public/media/amber-hour-bottle.jpg or public/media/hero-film.mp4.
 * Supported: .avif .webp .jpg .jpeg .png (images) and .mp4 .webm (video).
 * The site picks it up automatically — no code changes needed.
 */

export type SlotKind = 'image' | 'video'

export type SlotDef = {
  kind: SlotKind
  /** Shown inside the placeholder so the photographer knows what to shoot */
  brief: string
  /** Recommended ratio for the shot (the frame itself is set by the layout) */
  ratio: string
  alt: string
  /** Until this slot's own file arrives, borrow another slot's photograph */
  fallback?: string
  /**
   * Where the subject sits in the photograph (CSS object-position), so a frame of another shape
   * crops around it instead of through it, e.g. '72% 50%' for a bottle right of centre.
   */
  focus?: string
}

const fragranceSlots = (slug: string, name: string, mood: string): Record<string, SlotDef> => ({
  [`${slug}-cutout`]: {
    kind: 'image',
    ratio: '4:5',
    brief: `${name} — front-facing bottle isolated on a transparent background`,
    alt: `${name} by After Bells, with its engraved gold cap and gold front label`,
  },
  [`${slug}-bottle`]: {
    kind: 'image',
    ratio: '4:5',
    brief: `${name} — hero bottle shot, front-on, label visible`,
    alt: `${name} by After Bells, bottle with gold label`,
  },
  [`${slug}-detail`]: {
    kind: 'image',
    ratio: '4:5',
    brief: `${name} — macro of gold flakes and the heavy faceted glass base`,
    alt: `Gold flakes suspended in ${name}, seen through the thick glass base`,
  },
  [`${slug}-mood`]: {
    kind: 'image',
    ratio: '4:5',
    brief: `${name} — mood still life: ${mood}`,
    alt: `Ingredients and mood of ${name}`,
  },
  [`${slug}-cap`]: {
    kind: 'image',
    ratio: '16:9',
    brief: `${name} — close-up of the engraved gold cap above the glass shoulder`,
    alt: `The engraved gold cap of ${name}`,
    fallback: 'maison-atelier',
  },
})

const travelSlots = (slug: string, name: string): Record<string, SlotDef> => ({
  [`${slug}-15ml-bottle`]: {
    kind: 'image', ratio: '4:5',
    // a slim, tall bottle: when a frame crops it, keep the cap and trim the base
    focus: '50% 6%',
    brief: `${name} — 15 ml bottle with glossy gold cap and sideways gold After Bells wordmark`,
    alt: `${name} in a slim 15 ml glass bottle with a small glossy gold cap, gold After Bells lettering and natural gold flakes`,
  },
  [`${slug}-15ml-scene`]: {
    kind: 'image', ratio: '4:5',
    brief: `${name} — alternate angle of the 15 ml bottle`,
    alt: `An alternate view of the ${name} 15 ml bottle and its gold lettering`,
  },
  [`${slug}-15ml-detail`]: {
    kind: 'image', ratio: '4:5',
    brief: `${name} — macro of the 15 ml bottle's gold lettering and naturally settled gold flakes`,
    alt: `Fine gold leaf flakes at the glass base of ${name} 15 ml, beside the gold After Bells lettering`,
  },
  [`${slug}-15ml-cutout`]: {
    kind: 'image', ratio: '4:5',
    brief: `${name} — 15 ml product photograph`,
    alt: `${name} 15 ml with its small gold cap`,
    fallback: `${slug}-15ml-bottle`,
  },
  [`${slug}-15ml-cap`]: {
    kind: 'image', ratio: '4:5',
    brief: `${name} — 15 ml glossy gold cap and collar`,
    alt: `${name} 15 ml bottle with a small removable glossy gold cap`,
    fallback: `${slug}-15ml-bottle`,
  },
})

export const slots: Record<string, SlotDef> = {
  'hero-film': {
    kind: 'video',
    ratio: '16:9',
    brief: 'Brand film — 10–30s loop, muted, MP4 (H.264), 1920×1080',
    alt: 'After Bells brand film',
  },
  'hero-film-mobile': {
    kind: 'video',
    ratio: '9:16',
    brief: 'Phone film — the 9:16 launch reel, trimmed before the end card, MP4 (H.264) 720×1280',
    alt: 'After Bells launch film',
    fallback: 'hero-film',
  },
  'hero-poster-mobile': {
    kind: 'image',
    ratio: '9:16',
    brief: 'Phone film poster — first frame of the 9:16 reel',
    alt: 'After Bells',
    fallback: 'hero-poster',
  },
  'hero-poster': {
    kind: 'image',
    ratio: '16:9',
    brief: 'Film poster — first frame of the brand film',
    alt: 'After Bells',
  },
  ...fragranceSlots('amber-hour', 'Amber Hour', 'orange blossom, cinnamon, vanilla pods, warm dusk light'),
  ...fragranceSlots('open-sky', 'Open Sky', 'citron, sage, cut grass, an open road at dawn'),
  ...fragranceSlots('iron-crown', 'Iron Crown', 'frankincense smoke, myrrh resin, cedar, midnight'),
  ...travelSlots('amber-hour', 'Amber Hour'),
  ...travelSlots('open-sky', 'Open Sky'),
  ...travelSlots('iron-crown', 'Iron Crown'),
  // homepage film band: shown only once the photograph exists
  'amber-hour-scene': {
    kind: 'image',
    ratio: '16:9',
    // the bottle stands right of centre: keep it whole in portrait frames
    focus: '71% 50%',
    brief: 'Amber Hour — wide still life on a wooden table in low sun, with open space at left for the film button',
    alt: 'Amber Hour on a dark wooden table in low sunlight beside a linen curtain, its shadow glowing amber',
  },
  'iron-crown-scene': {
    kind: 'image',
    ratio: '16:9',
    // the bottle stands right of centre: keep it whole in portrait frames
    focus: '71% 50%',
    brief: 'Iron Crown — wide still life on dark stone under arches, a shaft of light, open space at left',
    alt: 'Iron Crown on dark stone beneath stone arches, a shaft of evening light behind it and gold flakes in the glass',
  },
  // photographed: described exactly
  'amber-hour-cap': {
    kind: 'image',
    ratio: '16:9',
    brief: 'Amber Hour — close-up of the engraved gold cap above the glass shoulder',
    alt: 'The engraved square gold cap of Amber Hour, close up, above the faceted glass shoulder',
    fallback: 'maison-atelier',
  },
  'collection-trio': {
    kind: 'image',
    ratio: '16:9',
    brief: 'The collection — Amber Hour, Open Sky & Iron Crown together',
    alt: 'Amber Hour, Open Sky and Iron Crown by After Bells',
  },
  'salon-backdrop': {
    kind: 'image',
    ratio: '3:2',
    brief: 'The Salon — dark espresso silk and honed stone, with a quiet centre for the invitation',
    alt: '',
  },
  'maison-atelier': {
    kind: 'image',
    ratio: '3:4',
    brief: 'The finishing — engraved gold cap and faceted glass',
    alt: 'Close-up of the ornate engraved gold cap on a limestone surface',
  },
  'maison-materials': {
    kind: 'image',
    ratio: '4:5',
    brief: 'Still life — 24k gold leaf, frankincense, vanilla, citrus',
    alt: 'Raw materials used by After Bells',
  },

  /* ---- The House page ---- */
  'house-model-hero-wide-v2': {
    kind: 'image',
    ratio: '16:9',
    brief: 'Full-width House campaign — a woman applying Amber Hour at right, with dark architectural space for the story at left',
    alt: 'A woman in a black jacket spraying Amber Hour at her neck, eyes closed, in a warm stone interior',
  },
  'house-model-hero-mobile-v2': {
    kind: 'image',
    ratio: '9:16',
    brief: 'Phone House campaign — the perfume application above quiet shadows for the opening words',
    alt: 'A woman applying Amber Hour to her neck beside a stone window',
  },
  'house-hero': {
    kind: 'image',
    ratio: '3:2',
    brief: 'The House — Amber Hour on warm-grey limestone, with dark space for the opening words',
    alt: 'Amber Hour on limestone, its engraved gold cap lit by a narrow shaft of evening light',
    fallback: 'hero-poster',
  },
  'house-gold-editorial': {
    kind: 'image',
    ratio: '2:3',
    brief: 'The gold — a close study of the original small flakes inside amber perfume and faceted glass',
    alt: 'Small gold flakes resting inside amber perfume above a thick, faceted clear glass base',
  },
  'house-cap': {
    kind: 'image',
    ratio: '2:3',
    brief: 'The cap — the detached engraved gold cap photographed as a sculpture on limestone',
    alt: 'An engraved square gold cap with a symmetrical scroll motif, resting on limestone',
  },
  'house-edition': {
    kind: 'image',
    ratio: '3:2',
    brief: 'The edition — quiet stone, reflected amber glass light and a few fine gold leaf flecks',
    alt: '',
  },
  'house-gold': {
    kind: 'image',
    ratio: '4:5',
    brief: 'Macro — 24k gold flakes drifting through the perfume',
    alt: 'Flakes of 24k gold drifting through the perfume',
    fallback: 'amber-hour-detail',
  },
  'house-label': {
    kind: 'image',
    ratio: '4:5',
    brief: 'Macro — the gold metal front label on the glass',
    alt: 'The gold metal label on an After Bells bottle',
    fallback: 'iron-crown-bottle',
  },
  'house-composition': {
    kind: 'image',
    ratio: '2:3',
    brief: 'The perfumer’s bench — blotters, glass vials and raw materials',
    alt: 'Blotters, vials and raw materials on the perfumer’s bench',
    fallback: 'maison-materials',
  },

  /* ---- Waitlist ---- */
  'waitlist-backdrop-desktop': {
    kind: 'image',
    ratio: '8:5',
    brief: 'Waitlist — three bottles frame a dark central doorway, with gold grazing light at the outer edges and space for the invitation',
    alt: '',
    fallback: 'collection-hero',
  },
  'waitlist-backdrop-mobile': {
    kind: 'image',
    ratio: '9:16',
    brief: 'Phone waitlist — a dark doorway with the three bottles on a low walnut ledge beneath open space for the invitation',
    alt: '',
    fallback: 'waitlist-backdrop-desktop',
  },
  /* ---- Collection page ---- */
  'collection-hero': {
    kind: 'image',
    ratio: '12:5',
    brief: 'The Golden Hour Collection — three bottles on a wooden table in warm evening sunlight, beside a linen curtain, with copy space at left',
    alt: 'Amber Hour, Open Sky and Iron Crown on a wooden table in golden-hour sunlight, beside a linen curtain and small white flowers',
    fallback: 'collection-trio',
  },
}

export type SlotName = keyof typeof slots

export type ResolvedMedia = {
  slot: string
  kind: SlotKind
  src: string | null
  brief: string
  ratio: string
  alt: string
  focus?: string
}
