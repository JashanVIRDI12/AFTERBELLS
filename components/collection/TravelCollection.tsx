import Link from 'next/link'
import { travelFragrances, giftSet } from '@/lib/catalog'
import type { ResolvedMedia } from '@/lib/media'
import { formatINR } from '@/lib/pricing'
import MediaSlot from '@/components/media/MediaSlot'
import ReserveButton from '@/components/ui/ReserveButton'
import ReserveNote from '@/components/ui/ReserveNote'
import EditionMeter from '@/components/ui/EditionMeter'
import ProductImage from '@/components/product/ProductImage'
import styles from './TravelCollection.module.css'

export function GiftSetFeature({ standalone = false }: { standalone?: boolean }) {
  const v = giftSet.variants[0]
  const separately = travelFragrances.reduce((n, f) => n + f.variants[0].price, 0)
  const Heading = standalone ? 'h1' : 'h3'
  return (
    <div id="gift-set" className={`${styles.gift} ${standalone ? styles.standalone : ''}`}>
      <div className={styles.giftVisual}>
        <ProductImage product={giftSet} sizes="(min-width: 900px) 48vw, 70vw" />
      </div>
      <div className={styles.giftCopy}>
        <Heading className={`t-title ${styles.giftTitle}`}>{standalone ? 'The 15 ml Gift Set' : 'Three hours. One gift.'}</Heading>
        <p className={styles.body}>Amber Hour, Open Sky and Iron Crown. One 15 ml bottle of each, with the house’s gold flakes and polished gold finish.</p>
        <ul className={styles.contents} aria-label="Gift set contents">
          {travelFragrances.map((f) => (
            <li key={f.slug}><Link href={`/fragrances/${f.slug}`}>{f.name}</Link><span>15 ml</span></li>
          ))}
        </ul>
        <div className={styles.giftPrice}>
          <span>{formatINR(v.price)}</span>
          <span className={styles.saving}>Save {formatINR(separately - v.price)} · {formatINR(separately)} separately</span>
        </div>
        <p className={styles.tax}>3 × 15 ml · Inclusive of all taxes</p>
        <EditionMeter variantId={v.id} compact quiet />
        <div className={styles.giftActions}>
          <ReserveButton variantId={v.id} label="Add the gift set" block />
          {!standalone && <Link href="/gift-set" className="link">View the set</Link>}
        </div>
        <ReserveNote />
      </div>
    </div>
  )
}

export default function TravelCollection({ media }: { media: Record<string, ResolvedMedia> }) {
  return (
    <section id="15ml" className={styles.section} data-header="light" data-own-cta aria-labelledby="travel-title">
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="travel-title" className={`t-title ${styles.title}`}>Your hour, wherever.</h2>
          <p className={styles.intro}>The three house fragrances, now in 15 ml. Carry your favourite, or give all three.</p>
        </header>
        <p className={styles.swipe} aria-hidden>
          Swipe for all three
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M4 12h15M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </p>
        <ul className={styles.grid} aria-label="The 15 ml bottles">
          {travelFragrances.map((f) => {
            const v = f.variants[0]
            return (
              <li key={f.slug} className={styles.item}>
                <Link href={`/fragrances/${f.slug}`} className={styles.visual} aria-label={`Discover ${f.name} 15 ml`}>
                  <MediaSlot media={media[f.media[0]]} theme={f.theme} reveal={false} sizes="(min-width: 900px) 30vw, (min-width: 700px) 33vw, 76vw" className={styles.photo} />
                </Link>
                <div className={styles.info}>
                  <h3 className={`t-name ${styles.name}`}><Link href={`/fragrances/${f.slug}`}>{f.name}</Link></h3>
                  <p className={styles.family}>{f.family} · 15 ml</p>
                  <p className={styles.price}>{formatINR(v.price)}<span>Inclusive of taxes</span></p>
                  <EditionMeter variantId={v.id} compact quiet />
                  <div className={styles.actions}>
                    <ReserveButton variantId={v.id} variant="line" label="Add to bag" />
                    <Link href={`/fragrances/${f.slug}`} className="link">Discover</Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        <GiftSetFeature />
      </div>
    </section>
  )
}
