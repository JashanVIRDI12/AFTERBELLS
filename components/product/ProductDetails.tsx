import type { Fragrance } from '@/lib/catalog'
import { formatINR } from '@/lib/pricing'
import { site } from '@/lib/site'
import styles from './ProductDetails.module.css'

/**
 * The declarations a packaged product must carry when sold online in India
 * (net quantity, MRP, origin, who made and sold it, customer care).
 * Seller fields stay hidden until they are filled in lib/site.ts.
 */
export default function ProductDetails({ product: f }: { product: Fragrance }) {
  const v = f.variants[0]
  const { legal } = site
  const c = site.concierge[0]
  const rows: [string, string][] = [
    ['Product', `${f.name}, ${f.concentration}`],
    ['Net quantity', v.size],
    ['MRP', `${formatINR(v.price)} (inclusive of all taxes)`],
    ['Country of origin', legal.countryOfOrigin],
  ]
  if (legal.manufacturer) rows.push(['Manufactured by', legal.manufacturer])
  if (legal.entity) rows.push(['Marketed by', legal.address ? `${legal.entity}, ${legal.address}` : legal.entity])
  rows.push(['Customer care', `${c.display} (call or WhatsApp)${site.emailLive ? ` · ${site.email}` : ''}`])

  return (
    <details className={styles.details}>
      <summary>Product details</summary>
      <dl>
        {rows.map(([k, val]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
