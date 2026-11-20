/**
 * A colour for every ingredient in the collection, used for the highlighted words in each story.
 */
const NOTE_COLOURS: Record<string, string> = {
  // citrus, blossom, pepper
  Citron: '#E6CC3A',
  Bergamot: '#B5C447',
  Lemon: '#F0D64B',
  'Orange Blossom': '#F0D9AE',
  'Pink Pepper': '#D8778B',
  // spice
  Cinnamon: '#B0582A',
  Cardamom: '#93A86E',
  Nutmeg: '#9A6A42',
  // herbs and green
  'Clary Sage': '#87A585',
  'Cut Grass': '#68AC4B',
  'Juniper Berry': '#5A6894',
  // gourmand and resins
  'Bourbon Vanilla': '#DDBE7E',
  Vanilla: '#E2C88E',
  Elemi: '#C4BC76',
  Praline: '#A86F3C',
  Amber: '#C9741E',
  Frankincense: '#BBA98A',
  Myrrh: '#8F5636',
  // woods, earth, skin
  Cedarwood: '#A3724A',
  'Atlas Cedar': '#94694A',
  'Guaiac Wood': '#6D4A32',
  Vetiver: '#6E6C44',
  Patchouli: '#5C4636',
  'Soft Leather': '#7B5039',
  Musk: '#D9C9BF',
}

export const noteColour = (note: string) => NOTE_COLOURS[note] ?? '#B9A27A'

/** How a note may be written in the stories, when not by its full name */
const ALIASES: Record<string, string[]> = {
  Cedarwood: ['cedar'],
  'Atlas Cedar': ['cedar'],
  'Juniper Berry': ['juniper'],
}

export type StoryPart = string | { text: string; note: string }

/**
 * Split each story paragraph so the first mention of every note can be marked in its colour.
 * Longer names are matched first, so "bourbon vanilla" wins over "vanilla".
 * Words inside the perfume's own name ("Amber" in "Amber Hour") are left alone.
 */
export function markNotes(paragraphs: string[], notes: string[], name = ''): StoryPart[][] {
  const terms = notes
    .flatMap((n) => [n, ...(ALIASES[n] ?? [])].map((t) => ({ t: t.toLowerCase(), note: n })))
    .sort((a, b) => b.t.length - a.t.length)
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b(${terms.map((x) => escape(x.t)).join('|')})\\b`, 'gi')
  const seen = new Set<string>()

  const nameRe = name ? new RegExp(escape(name), 'gi') : null

  return paragraphs.map((p) => {
    const out: StoryPart[] = []
    const inName = nameRe ? [...p.matchAll(nameRe)].map((m) => [m.index, m.index + m[0].length]) : []
    let last = 0
    for (const m of p.matchAll(re)) {
      const note = terms.find((x) => x.t === m[0].toLowerCase())?.note
      if (!note || seen.has(note)) continue
      if (inName.some(([a, b]) => m.index >= a && m.index < b)) continue
      seen.add(note)
      if (m.index > last) out.push(p.slice(last, m.index))
      out.push({ text: m[0], note })
      last = m.index + m[0].length
    }
    if (last < p.length) out.push(p.slice(last))
    return out
  })
}
