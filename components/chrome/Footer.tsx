import Link from 'next/link'
import { fragrances } from '@/lib/catalog'
import { site, whatsappLink } from '@/lib/site'
import Image from 'next/image'
import { Peacock, Wordmark } from '@/components/brand/Brand'
import { getMedia } from '@/lib/media.server'
import Corners from '@/components/ui/Corners'
import SalonForm from './SalonForm'
import HideOn from './HideOn'
import styles from './Footer.module.css'

export default function Footer() {
  const backdrop = getMedia('salon-backdrop')
  return (
    <footer className={styles.footer} data-header="dark">
      <HideOn prefix={['/checkout', '/admin']}>
      {/* Letters from the House: an invitation sealed with the peacock */}
      <section id="salon" className={styles.salon} aria-labelledby="salon-title">
        <div className={styles.salonBackdrop} aria-hidden>
          {backdrop.src && <Image src={backdrop.src} alt="" fill sizes="100vw" quality={85} className={styles.salonImg} />}
          <span className={styles.salonVeil} />
        </div>
        <div className="wrap">
          <div className={`${styles.letter} glass heritage`}>
            <Corners />
            <span className={styles.seal} aria-hidden>
              <Peacock className={styles.sealMark} shine />
            </span>
            <p className={`t-eyebrow ${styles.salonKicker}`}>Letters from the House</p>
            <h2 id="salon-title" className={`t-title ${styles.salonTitle}`}>
              Be the first to hear <span className="gold-text">the next bell.</span>
            </h2>
            <div className={styles.salonRule} aria-hidden>
              <span />
              <i />
              <span />
            </div>
            <p className={styles.salonSub}>
              Private previews of new hours, and invitations from the house. Written rarely, never more than once a
              month.
            </p>
            <SalonForm />
          </div>
        </div>
      </section>

      <div className={`wrap ${styles.grid}`}>
        <nav aria-label="Collection">
          <p className={styles.h}>The Collection</p>
          <ul>
            {fragrances.map((f) => (
              <li key={f.slug}>
                <Link href={`/fragrances/${f.slug}`}>
                  <span className={styles.no}>{f.no}</span> {f.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="The house">
          <p className={styles.h}>The House</p>
          <ul>
            <li>
              <Link href="/house">Our story</Link>
            </li>
            <li>
              <Link href="/collection">The collection</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Care">
          <p className={styles.h}>Client Care</p>
          <ul>
            <li>
              <Link href="/client-care">Questions &amp; contact</Link>
            </li>
            <li>
              <Link href="/feedback">Share your feedback</Link>
            </li>
            <li>
              <Link href="/policies#terms">Terms of sale</Link>
            </li>
            <li>
              <Link href="/policies#shipping">Shipping &amp; returns</Link>
            </li>
            <li>
              <Link href="/policies#privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/policies#seller">Seller &amp; grievance</Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className={styles.h}>Concierge</p>
          <ul>
            <li>
              <a href={whatsappLink('Hello After Bells, I have a question.')} target="_blank" rel="noopener noreferrer">
                WhatsApp the concierge
              </a>
            </li>
            {site.concierge.map((c) => (
              <li key={c.tel}>
                <a href={`tel:${c.tel}`}>Call {c.display}</a>
              </li>
            ))}
            {site.emailLive && (
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
            )}
            <li>
              <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer">
                Instagram · @{site.instagram}
              </a>
            </li>
          </ul>
        </div>
      </div>

      </HideOn>

      <div className={`wrap ${styles.bottom}`}>
        <Wordmark className={styles.word} />
        <div className={styles.legal}>
          <span>
            © {new Date().getFullYear()} {site.legal.entity || 'After Bells'}
            {site.legal.gstin ? ` · GSTIN ${site.legal.gstin}` : ''}
          </span>
          <span className="lockup">Maison de Parfum · Reserved for the exceptional</span>
          <span>Prices inclusive of all taxes · India</span>
        </div>
      </div>
    </footer>
  )
}
