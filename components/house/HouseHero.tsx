import { getImageProps } from 'next/image'
import type { ResolvedMedia } from '@/lib/media'
import styles from './HouseHero.module.css'

export default function HouseHero({ media, mobileMedia }: { media: ResolvedMedia; mobileMedia: ResolvedMedia }) {
  const common = { alt: media.alt, sizes: '100vw', quality: 92, loading: 'eager' as const, fetchPriority: 'high' as const }
  const desktop = media.src ? getImageProps({ ...common, src: media.src, width: 2400, height: 1340 }).props : null
  const phone = mobileMedia.src ? getImageProps({ ...common, src: mobileMedia.src, width: 941, height: 1672 }).props : null

  return (
    <section className={styles.hero} data-header="dark" data-media-slot={media.slot} aria-labelledby="house-heading">
      <div className={styles.backdrop}>
        {desktop && (
          <picture className={styles.picture}>
            {phone && <source media="(max-width: 767px)" srcSet={phone.srcSet} sizes={phone.sizes} width={941} height={1672} />}
            {/* The responsive picture uses Next Image's optimized sources. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...desktop} className={styles.image} />
          </picture>
        )}
        <span className={styles.veil} aria-hidden="true" />
      </div>
      <div className={`wrap ${styles.layout}`}>
        <div className={styles.copy}>
          <p className={`t-eyebrow ${styles.kicker}`}>The House of After Bells</p>
          <h1 id="house-heading" className={`t-title ${styles.title}`}>
            Some hours <span className={`gold-text ${styles.accent}`}>stay with you.</span>
          </h1>
          <p className={styles.lede}>
            Perfume for the moments that linger.
            <span className={styles.details}> The warmth of dusk, the openness of dawn, the depth of midnight.</span>
          </p>
          <a className={styles.anchor} href="#our-story">
            Discover our story
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 4v15m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
