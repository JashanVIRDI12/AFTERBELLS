import type { Metadata } from 'next'
import { getImageProps } from 'next/image'
import Link from 'next/link'
import { BellRing, Gift, KeyRound } from 'lucide-react'
import { getMedia } from '@/lib/media.server'
import { site, whatsappLink } from '@/lib/site'
import { Wordmark } from '@/components/brand/Brand'
import GoldFlakes from '@/components/brand/GoldFlakes'
import WaitlistForm from '@/components/waitlist/WaitlistForm'
import OwnerEntry from '@/components/waitlist/OwnerEntry'
import styles from './Waitlist.module.css'

export const metadata: Metadata = {
  title: 'Join the waitlist',
  description: 'The First Edition of After Bells opens soon: three perfumes at 20% perfume oil, finished with 24k gold. Join the waitlist to be first.',
  alternates: { canonical: '/waitlist' },
}

const PERKS = [
  { Icon: KeyRound, title: 'Early access' },
  { Icon: BellRing, title: 'Opening-day message' },
  { Icon: Gift, title: 'Vials, video & free delivery with every order' },
]

/** Before opening, every page leads here (proxy.ts). */
export default async function WaitlistPage(props: PageProps<'/waitlist'>) {
  const sp = await props.searchParams
  const owner = typeof sp.owner === 'string' ? sp.owner : ''
  const photo = getMedia('waitlist-backdrop-desktop')
  const mobilePhoto = getMedia('waitlist-backdrop-mobile')
  const common = { alt: '', fill: true, sizes: '100vw', quality: 85 } as const
  const desktop = photo.src ? getImageProps({ ...common, src: photo.src }).props : null
  const mobile = mobilePhoto.src ? getImageProps({ ...common, src: mobilePhoto.src }).props : null

  return (
    <section className={styles.page} data-header="dark">
      <div className={styles.backdrop} aria-hidden>
        {desktop && (
          <picture className={styles.scene}>
            {mobile && <source media="(max-width: 959px)" srcSet={mobile.srcSet} sizes={mobile.sizes} />}
            <img {...desktop} alt="" loading="eager" fetchPriority="high" className={styles.photo} />
          </picture>
        )}
        <span className={styles.veil} />
        <GoldFlakes className={styles.flakes} density={0.9} size={5} speed={0.55} />
      </div>

      <header className={styles.top}>
        <Wordmark className={styles.word} />
      </header>

      <div className={styles.center}>
        <p className={styles.eyebrow}>The First Edition · Opening soon</p>
        <h1 className={styles.title}>
          Be first through <span className="gold-text">the doors.</span>
        </h1>
        <p className={styles.lede}>Three perfumes finished with 24k gold. Join the list and hear the moment we open.</p>

        <div className={styles.formWrap}>
          <WaitlistForm />
        </div>

        <ul className={styles.perks}>
          {PERKS.map((p) => (
            <li key={p.title}>
              <p.Icon size={16} strokeWidth={1.5} aria-hidden />
              {p.title}
            </li>
          ))}
        </ul>
      </div>

      <footer className={styles.foot}>
        <span>
          Questions?{' '}
          <a href={whatsappLink('Hello After Bells, I have a question about the opening.')} target="_blank" rel="noopener noreferrer">
            WhatsApp {site.concierge[0].display}
          </a>{' '}
          ·{' '}
          <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">
            @{site.instagram}
          </a>{' '}
          · <Link href="/policies#privacy">Privacy</Link>
        </span>
        <OwnerEntry state={owner} />
      </footer>
    </section>
  )
}
