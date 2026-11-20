import type { Metadata } from 'next'
import { faqs, vials } from '@/lib/content'
import { fragrances, signature } from '@/lib/catalog'
import { site } from '@/lib/site'
import { getMediaMap } from '@/lib/media.server'
import PreorderHero from '@/components/preorder/PreorderHero'
import Privileges from '@/components/preorder/Privileges'
import Journey from '@/components/preorder/Journey'
import ReserveStrip from '@/components/preorder/ReserveStrip'
import Faq from '@/components/home/Faq'
import styles from './Details.module.css'

export const metadata: Metadata = {
  title: `Preorder the ${site.preorder.edition}`,
  description: `Reserve the After Bells ${site.preorder.edition}: dispatched from ${site.preorder.dispatchLabel}, with a complimentary 15 ml perfume, first access to Edition II and priority concierge.`,
  alternates: { canonical: '/preorder' },
}

const details = [
  { k: 'Preorders close', v: site.preorder.closesLabel },
  { k: 'Delivery', v: `Preorders leave first, from ${site.preorder.dispatchLabel}. ${site.shipping.note}, tracked by email and SMS.` },
  { k: 'Bottle', v: `${fragrances[0]?.variants[0]?.size ?? ''} Eau de Parfum, ${signature.strengthLabel}, 24k gold flakes.` },
  { k: 'With every preorder', v: `A complimentary 15 ml perfume of the house, and first access to Edition II. ${vials.body}` },
  { k: 'Payment', v: 'Paid in full when you reserve. UPI, RuPay, Visa, Mastercard, net banking and wallets, through Razorpay.' },
  { k: 'Per order', v: `Up to ${site.preorder.maxPerVariant} bottles of each fragrance` },
  { k: 'Changes', v: `Amend or cancel for a full refund until ${site.preorder.closesLabel}.` },
]

const PREORDER_QS = [
  'What do I receive for reserving now?',
  'When will my order arrive?',
  'Why is it a preorder?',
  'How do I pay?',
  'Can I change or cancel my preorder?',
]

export default function PreorderPage() {
  const media = getMediaMap(['collection-trio', ...fragrances.map((f) => `${f.slug}-cutout`)])
  return (
    <>
      <PreorderHero backdrop={media['collection-trio']} />
      <Privileges />
      <Journey />
      <section className={`section ${styles.details}`} data-header="light" aria-labelledby="details-title">
        <div className={`wrap ${styles.grid}`}>
          <h2 id="details-title" className={`t-title ${styles.title}`} data-reveal>
            The details
          </h2>
          <dl className={styles.list}>
            {details.map((d, i) => (
              <div key={d.k} data-reveal style={{ '--d': `${i * 0.05}s` } as React.CSSProperties}>
                <dt>{d.k}</dt>
                <dd>{d.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <Faq title="Before you reserve" items={faqs.filter((f) => PREORDER_QS.includes(f.q))} />
      <ReserveStrip media={media} />
    </>
  )
}
