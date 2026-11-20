/**
 * One colour per accord, the way perfume guides show them: citrus is sun-yellow, woods are brown, and so on.
 * A fragrance's top three accords tint the soft lights behind the glass in its composition section.
 */
export const ACCORDS = {
  citrus: { label: 'Citrus', color: '#E9C33B' },
  aromatic: { label: 'Aromatic', color: '#4F9E84' },
  'fresh spicy': { label: 'Fresh spicy', color: '#94BF57' },
  green: { label: 'Green', color: '#3F8F4C' },
  woody: { label: 'Woody', color: '#7C502D' },
  earthy: { label: 'Earthy', color: '#675741' },
  leather: { label: 'Leather', color: '#5C3A29' },
  vanilla: { label: 'Vanilla', color: '#F2DFAA' },
  sweet: { label: 'Sweet', color: '#D9506A' },
  amber: { label: 'Amber', color: '#C9691F' },
  'warm spicy': { label: 'Warm spicy', color: '#B13B22' },
  'white floral': { label: 'White floral', color: '#EEDFD6' },
  incense: { label: 'Incense', color: '#857B72' },
  balsamic: { label: 'Balsamic', color: '#9B6040' },
} as const

export type AccordKey = keyof typeof ACCORDS
