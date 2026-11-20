const ORDINALS = [
  '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth',
  'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth',
  'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first',
]

/** '31 December 2026' → 'the thirty-first of December, 2026' (falls back to the label as given). */
export function dateInWords(label: string, withYear = true) {
  const m = label.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (!m) return label
  const day = ORDINALS[Number(m[1])]
  if (!day) return label
  return `the ${day} of ${m[2]}${withYear ? `, ${m[3]}` : ''}`
}
