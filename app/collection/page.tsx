import type { Metadata } from 'next'
import { fragrances, travelFragrances, signature } from '@/lib/catalog'
import { getMediaMap } from '@/lib/media.server'
import { site } from '@/lib/site'
import PageHero from '@/components/page/PageHero'
import ProductGrid from '@/components/collection/ProductGrid'
import FinderSection from '@/components/finder/FinderSection'
import Signature from '@/components/collection/Signature'
import DiscoveryWaitlist from '@/components/collection/DiscoveryWaitlist'
import TravelCollection from '@/components/collection/TravelCollection'

export const metadata: Metadata = {
  title: 'The Collection',
  description: `Amber Hour, Open Sky and Iron Crown — universal perfumes at ${signature.strengthLabel}, finished with 24k gold flakes. The ${site.edition.name} is available now.`,
  alternates: { canonical: '/collection' },
}

export default function CollectionPage() {
  const media = getMediaMap([
    'collection-hero',
    'house-gold',
    ...fragrances.flatMap((f) => [`${f.slug}-bottle`, `${f.slug}-mood`]),
    ...travelFragrances.map((f) => f.media[0]),
  ])

  return (
    <>
      <PageHero
        media={media['collection-hero']}
        mediaMotion={false}
        size="short"
        eyebrow={`The ${site.edition.name}`}
        title={
          <>
            The <span className="gold-text">Collection</span>
          </>
        }
        lede={`Three universal perfumes at ${signature.strengthLabel}. Each made once, in limited number.`}
      />
      <ProductGrid media={media} />
      <FinderSection />
      <TravelCollection media={media} />
      <DiscoveryWaitlist />
      <Signature media={media['house-gold']} />
    </>
  )
}
