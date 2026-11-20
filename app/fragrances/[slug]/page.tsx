import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allFragrances, fragrances, travelFragrances, fromPrice, getFragrance } from '@/lib/catalog'
import { getMediaMap } from '@/lib/media.server'
import { site } from '@/lib/site'
import ProductHero from '@/components/product/ProductHero'
import Composition from '@/components/product/Composition'
import Story from '@/components/product/Story'
import Finishing from '@/components/product/Finishing'
import OtherHours from '@/components/product/OtherHours'

export function generateStaticParams() {
  return allFragrances.map((f) => ({ slug: f.slug }))
}

export const dynamicParams = false

export async function generateMetadata(props: PageProps<'/fragrances/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const f = getFragrance(slug)
  if (!f) return {}
  return {
    title: `${f.name} ${f.variants[0].size} — ${f.family}`,
    description: `${f.tagline} ${f.description}`,
    alternates: { canonical: `/fragrances/${f.slug}` },
    openGraph: {
      title: `${f.name} · ${site.name}`,
      description: f.description,
      images: [{ url: f.image, width: 1122, height: 1402, alt: `${f.name} by ${site.name}` }],
    },
    twitter: { card: 'summary_large_image', images: [f.image] },
  }
}

export default async function FragrancePage(props: PageProps<'/fragrances/[slug]'>) {
  const { slug } = await props.params
  const f = getFragrance(slug)
  if (!f) notFound()

  const others = (f.format === 'travel' ? travelFragrances : fragrances).filter((o) => o.slug !== f.slug)
  const media = getMediaMap([
    ...f.media,
    `${f.slug}-cutout`,
    `${f.slug}-cap`,
    ...others.map((o) => o.media[0]),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: f.name,
    brand: { '@type': 'Brand', name: site.name },
    description: f.description,
    category: 'Fragrance',
    size: f.variants[0].size,
    countryOfOrigin: site.legal.countryOfOrigin,
    image: `${site.url}${f.image}`,
    url: `${site.url}/fragrances/${f.slug}`,
    offers: {
      '@type': 'Offer',
      price: fromPrice(f),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${site.url}/fragrances/${f.slug}`,
    },
  }

  return (
    <>
      <ProductHero product={f} media={f.media.map((m) => media[m])} />
      <Story product={f} />
      <Composition product={f} cutout={media[`${f.slug}-cutout`]} />
      <Finishing product={f} media={media[`${f.slug}-cap`]} />
      <OtherHours products={others} media={media} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
