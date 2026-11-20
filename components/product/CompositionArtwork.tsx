import Image from 'next/image'

const NOTE_ARTWORK: Record<string, string> = {
  'Orange Blossom': 'orange-blossom',
  Bergamot: 'citrus',
  'Bourbon Vanilla': 'vanilla',
  Praline: 'praline',
  Citron: 'citrus',
  'Clary Sage': 'sage',
  Cedarwood: 'cedar',
  'Atlas Cedar': 'cedar',
  Frankincense: 'incense',
}

export type WearKey = 'winter' | 'spring' | 'summer' | 'autumn' | 'day' | 'night'

/** Decorative botanical engravings; the adjacent note lists supply the accessible names. */
export function NoteIllustration({ note, className }: { note: string; className?: string }) {
  const artwork = NOTE_ARTWORK[note]
  if (!artwork) return null

  return <Image src={`/media/composition/engravings/${artwork}-ivory.webp`} alt="" aria-hidden width={144} height={144} sizes="(min-width: 760px) 144px, 120px" className={className} />
}

export function WearIllustration({ name, className }: { name: WearKey; className?: string }) {
  return <Image src={`/media/composition/engravings/${name}-ivory.webp`} alt="" aria-hidden width={56} height={56} sizes="56px" className={className} />
}
