import { fragrances, travelFragrances, fromPrice } from '@/lib/catalog'
import { getMediaMap } from '@/lib/media.server'
import { site } from '@/lib/site'
import Hero from '@/components/home/Hero'
import Collection from '@/components/home/Collection'
import House from '@/components/home/House'
import GoldMoment from '@/components/home/GoldMoment'
import Compliments from '@/components/home/Compliments'
import SceneBand from '@/components/home/SceneBand'
import Faq from '@/components/home/Faq'
import ReserveDock from '@/components/home/ReserveDock'
import TravelCollection from '@/components/collection/TravelCollection'

export default function HomePage() {
  const media = getMediaMap([
    'hero-film',
    'hero-poster',
    'hero-film-mobile',
    'hero-poster-mobile',
    ...fragrances.map((f) => `${f.slug}-cutout`),
    ...travelFragrances.map((f) => f.media[0]),
    'maison-atelier',
    'maison-materials',
    'amber-hour-mood',
    'house-gold',
    'amber-hour-scene',
  ])

  const amberHour = fragrances.find((f) => f.slug === 'amber-hour')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon-512.png`,
        slogan: site.tagline,
        contactPoint: site.concierge.map((c) => ({
          '@type': 'ContactPoint',
          telephone: c.tel,
          contactType: 'customer service',
          areaServed: 'IN',
        })),
        sameAs: [`https://instagram.com/${site.instagram}`],
      },
      ...fragrances.map((f) => ({
        '@type': 'Product',
        name: `${f.name} — ${site.name}`,
        description: f.description,
        size: f.variants[0].size,
        image: `${site.url}${f.image}`,
        brand: { '@type': 'Brand', name: site.name },
        url: `${site.url}/fragrances/${f.slug}`,
        offers: {
          '@type': 'Offer',
          price: fromPrice(f),
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
      })),
    ],
  }

  return (
    <>
      <Hero
        film={media['hero-film']}
        poster={media['hero-poster']}
        filmMobile={media['hero-film-mobile']}
        posterMobile={media['hero-poster-mobile']}
      />
      <Collection media={media} />
      <TravelCollection media={media} />
      <GoldMoment media={media['house-gold']} />
      {amberHour && <SceneBand product={amberHour} media={media['amber-hour-scene']} />}
      <House media={media} />
      <Compliments backdrop={media['amber-hour-mood']} />
      <Faq limit={4} />
      <ReserveDock />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
