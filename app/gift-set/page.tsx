import Link from 'next/link'
import type { Metadata } from 'next'
import { giftSet } from '@/lib/catalog'
import { site } from '@/lib/site'
import { GiftSetFeature } from '@/components/collection/TravelCollection'
import styles from './GiftSet.module.css'

export const metadata: Metadata = {
  title: 'The 15 ml Gift Set',
  description: 'Amber Hour, Open Sky and Iron Crown, one 15 ml bottle of each. The three-fragrance gift set is ₹2,099, inclusive of taxes.',
  alternates: { canonical: '/gift-set' },
  openGraph: { images: giftSet.images?.map((url) => ({ url, width: 1122, height: 1402 })) },
}

export default function GiftSetPage() {
  const v = giftSet.variants[0]
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: giftSet.name, sku: v.id, size: v.size,
    description: metadata.description,
    brand: { '@type': 'Brand', name: site.name },
    image: giftSet.images?.map((src) => `${site.url}${src}`),
    url: `${site.url}/gift-set`,
    offers: { '@type': 'Offer', price: v.price, priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: `${site.url}/gift-set` },
  }
  return (
    <section className={styles.page} data-header="light" aria-label="The 15 ml Gift Set">
      <div className="wrap">
        <Link href="/collection#15ml" className={styles.back}>← The 15 ml collection</Link>
        <GiftSetFeature standalone />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  )
}
