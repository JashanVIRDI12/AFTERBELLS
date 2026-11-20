import type { Metadata } from 'next'
import Link from 'next/link'
import { site, whatsappLink } from '@/lib/site'
import PageHero from '@/components/page/PageHero'
import Faq from '@/components/home/Faq'
import TrackForm from '@/components/care/TrackForm'
import styles from './Care.module.css'

export const metadata: Metadata = {
  title: 'Client Care',
  description: `Questions about your After Bells order, delivery, payment or gifting. Call or WhatsApp our concierge on ${site.concierge.map((c) => c.display).join(' or ')}.`,
  alternates: { canonical: '/client-care' },
}

export default function ClientCarePage() {
  const ways = [
    {
      k: 'WhatsApp',
      v: 'Message the concierge',
      href: whatsappLink('Hello After Bells, I have a question.'),
      note: 'The quickest way to reach the house. Photos welcome.',
      external: true,
    },
    {
      k: 'Instagram',
      v: `@${site.instagram}`,
      href: `https://instagram.com/${site.instagram}`,
      note: 'Send us a message, or follow the house.',
      external: true,
    },
    {
      k: 'Your feedback',
      v: 'Share your thoughts',
      href: '/feedback',
      note: 'Already wearing After Bells? Tell us about it.',
      external: false,
    },
  ]

  return (
    <>
      <PageHero
        eyebrow="Client Care"
        title={
          <>
            How may we <span className="gold-text">help?</span>
          </>
        }
        lede="Questions about your order, delivery or a gift. The concierge is here."
      />
      <section className={styles.ways} data-header="light" aria-label="Contact">
        <ul className={`wrap ${styles.list}`}>
          <li data-reveal>
            <div className={styles.card}>
              <span className={styles.k}>Call the concierge</span>
              {site.concierge.map((c) => (
                <a key={c.tel} href={`tel:${c.tel}`} className={styles.v}>
                  {c.display}
                </a>
              ))}
              <span className={styles.note}>For orders, changes and gifting.</span>
            </div>
          </li>
          {ways.map((w, i) => (
            <li key={w.k} data-reveal style={{ '--d': `${(i + 1) * 0.06}s` } as React.CSSProperties}>
              {w.external ? (
                <a
                  href={w.href}
                  className={styles.card}
                  {...(w.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <span className={styles.k}>{w.k}</span>
                  <span className={styles.v}>{w.v}</span>
                  <span className={styles.note}>{w.note}</span>
                </a>
              ) : (
                <Link href={w.href} className={styles.card}>
                  <span className={styles.k}>{w.k}</span>
                  <span className={styles.v}>{w.v}</span>
                  <span className={styles.note}>{w.note}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section id="track" className={styles.track} data-header="light" aria-labelledby="track-title">
        <div className={`wrap ${styles.trackInner}`}>
          <div>
            <p className="t-eyebrow">Your order</p>
            <h2 id="track-title" className={`t-title ${styles.trackTitle}`}>
              Track your order
            </h2>
          </div>
          <TrackForm />
        </div>
      </section>
      <Faq title="Questions" />
      <section className={styles.policies} data-header="light" aria-label="Policies">
        <div className={`wrap ${styles.policyRow}`}>
          <p className="t-eyebrow">The fine print</p>
          <nav className={styles.policyLinks} aria-label="Policies">
            <Link href="/policies#terms" className="link">
              Terms of sale
            </Link>
            <Link href="/policies#shipping" className="link">
              Shipping &amp; returns
            </Link>
            <Link href="/policies#privacy" className="link">
              Privacy
            </Link>
          </nav>
        </div>
      </section>
    </>
  )
}
