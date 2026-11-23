import type { Metadata } from 'next'
import { fragrances, signature } from '@/lib/catalog'
import { getMediaMap } from '@/lib/media.server'
import HouseHero from '@/components/house/HouseHero'
import HouseStory from '@/components/house/HouseStory'
import HourTrio from '@/components/house/HourTrio'
import Making from '@/components/house/Making'
import FairPrice from '@/components/house/FairPrice'

export const metadata: Metadata = {
  title: 'The House',
  description:
    'Discover After Bells: universal perfumes inspired by the warmth of dusk, the clarity of dawn and the depth of midnight. Read the story of our First Edition.',
  alternates: { canonical: '/house' },
}

export default function HousePage() {
  const media = getMediaMap([
    'house-model-hero-wide-v2',
    'house-model-hero-mobile-v2',
    ...fragrances.map((f) => `${f.slug}-cutout`),
    'house-composition',
    'house-gold-editorial',
    'house-cap',
    'house-edition',
  ])

  const steps = [
    {
      no: 'I',
      title: 'The composition',
      body: `Resins, woods, vanilla and citrus give each hour its character. Every composition is universal, created at ${signature.strengthLabel}.`,
      media: media['house-composition'],
    },
    {
      no: 'II',
      title: 'The gold',
      body: 'Flakes of 24k gold rest in every bottle. Turn it, and they rise.',
      media: media['house-gold-editorial'],
    },
    {
      no: 'III',
      title: 'The cap',
      body: 'Each bottle is crowned with an engraved square cap of zamac, finished in gold tone.',
      media: media['house-cap'],
    },
  ]

  return (
    <>
      <HouseHero media={media['house-model-hero-wide-v2']} mobileMedia={media['house-model-hero-mobile-v2']} />
      <HouseStory />
      <HourTrio media={media} />
      <Making steps={steps} />
      <FairPrice media={media['house-edition']} />
    </>
  )
}
