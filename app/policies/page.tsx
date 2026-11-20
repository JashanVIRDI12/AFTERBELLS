import type { Metadata } from 'next'
import { site, whatsappLink } from '@/lib/site'
import ConciergePhones from '@/components/ui/ConciergePhones'
import styles from './Policies.module.css'

export const metadata: Metadata = {
  title: 'Terms of sale, delivery & privacy',
  description: 'How After Bells orders, delivery, returns and privacy work.',
}

/**
 * PLACEHOLDER — sensible starting terms for an Indian D2C brand.
 * Have them reviewed (consumer protection / e-commerce rules) before launch.
 */
export default function PoliciesPage() {
  const e = site.edition
  const d = site.delivery
  const L = site.legal
  return (
    <section className={styles.page} data-header="light">
      <div className={styles.wrap}>
        <p className="t-eyebrow">Client care</p>
        <h1 className="t-title t-h2">The fine print</h1>
        <nav className={styles.toc} aria-label="On this page">
          <a href="#terms">Terms of sale</a>
          <a href="#shipping">Delivery &amp; returns</a>
          <a href="#privacy">Privacy</a>
          <a href="#seller">Seller &amp; grievance</a>
        </nav>

        <article id="terms" className={styles.block}>
          <h2>Terms of sale</h2>
          <p>
            When you place an order you pay {site.deposit.enabled ? 'in full or a deposit' : 'in full'} at checkout, and a bottle from the {e.name}{' '}
            is set aside for you. Each guest may order up to {e.maxPerVariant} bottles of each fragrance. Prices are in Indian rupees and
            inclusive of all taxes.
          </p>
          <p>
            You may change or cancel an order free of charge until it is dispatched: call or send a WhatsApp message to our concierge on{' '}
            <ConciergePhones /> with your order number. Refunds are returned to the original payment method within 7 working days.
          </p>
        </article>

        <article id="shipping" className={styles.block}>
          <h2>Delivery &amp; returns</h2>
          <p>
            {site.shipping.note}. {d.fast}; {d.standard} elsewhere. Every parcel is tracked: you will receive tracking details by email and SMS on
            dispatch.
          </p>
          <p>
            For reasons of hygiene, opened fragrances cannot be returned. If your bottle arrives damaged, photograph the parcel and the bottle and
            send the photographs to our concierge on{' '}
            <a href={whatsappLink('Hello After Bells, my parcel arrived damaged.')} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            {site.emailLive ? (
              <>
                {' '}
                or to <a href={`mailto:${site.email}`}>{site.email}</a>
              </>
            ) : null}{' '}
            within 48 hours of delivery. We will replace it.
          </p>
          <p>The 24k gold flakes in every bottle are decorative and settle naturally; this is not a defect.</p>
        </article>

        <article id="privacy" className={styles.block}>
          <h2>Privacy</h2>
          <p>
            We collect only what we need to fulfil your order — your name, contact details and delivery address — and use it solely to process,
            deliver and support your order. Payments are handled by Razorpay; we never see or store your card details.
          </p>
          <p>
            If you join the Salon or the discovery set waitlist, we will email you no more than once a month, and you can unsubscribe at any time.
            If you ask for order updates on WhatsApp, we use your mobile number only for those messages. We never sell or share your information.
            To access or delete your data, call or message our concierge on <ConciergePhones />.
          </p>
          <p>
            At checkout, the PIN code you type is looked up in a public postal directory to fill in your city and state. Only the PIN code is
            sent.
          </p>
          <p>
            To understand how the site is used, we count visits anonymously: a random identifier kept in your browser, the pages you view, the
            site that referred you, your type of device and an approximate city. We do not record your name, email or IP address with this, we
            use no advertising cookies, and if your browser sends &ldquo;Do Not Track&rdquo; we do not count you at all.
          </p>
        </article>

        <article id="seller" className={styles.block}>
          <h2>Seller &amp; grievance officer</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Sold by</dt>
              <dd>
                {L.entity || site.name}
                {L.address ? `, ${L.address}` : ''}
              </dd>
            </div>
            {L.gstin && (
              <div>
                <dt>GSTIN</dt>
                <dd>{L.gstin}</dd>
              </div>
            )}
            {L.manufacturer && (
              <div>
                <dt>Manufactured by</dt>
                <dd>{L.manufacturer}</dd>
              </div>
            )}
            <div>
              <dt>Country of origin</dt>
              <dd>{L.countryOfOrigin}</dd>
            </div>
            <div>
              <dt>Customer care</dt>
              <dd>
                <ConciergePhones /> (call or WhatsApp){site.emailLive ? ` · ${site.email}` : ''}
              </dd>
            </div>
            <div>
              <dt>Grievance officer</dt>
              <dd>
                {L.grievance.name || 'The concierge'}
                {L.grievance.phone ? ` · ${L.grievance.phone}` : ''}
                {L.grievance.email ? ` · ${L.grievance.email}` : ''}
              </dd>
            </div>
          </dl>
          <p>Complaints are acknowledged within 48 hours and resolved within one month of receipt.</p>
        </article>
      </div>
    </section>
  )
}
