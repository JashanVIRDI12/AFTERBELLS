import Link from 'next/link'
import { faqs } from '@/lib/content'
import Accordion from '@/components/ui/Accordion'
import ConciergePhones from '@/components/ui/ConciergePhones'
import { whatsappLink } from '@/lib/site'
import styles from './Faq.module.css'

/** Client-care questions. The homepage shows the first few; /client-care shows them all. */
export default function Faq({
  limit,
  title = 'Questions',
  items: only,
}: {
  limit?: number
  title?: string
  /** show a chosen set instead of the full list */
  items?: { q: string; a: string }[]
}) {
  const all = only ?? faqs
  const items = limit ? all.slice(0, limit) : all
  return (
    <section id="faq" className={`section ${styles.faq}`} data-header="light" aria-labelledby="faq-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.head}>
          <p className="t-eyebrow" data-reveal>
            Client care
          </p>
          <h2 id="faq-title" className={`t-title ${styles.title}`} data-reveal style={{ '--d': '.08s' } as React.CSSProperties}>
            {title}
          </h2>
          <p className={styles.help} data-reveal style={{ '--d': '.16s' } as React.CSSProperties}>
            Something else? Call or{' '}
            <a href={whatsappLink('Hello After Bells, I have a question.')} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>{' '}
            our concierge on <ConciergePhones />.
          </p>
          {(limit || only) && (
            <Link href="/client-care" className="link" data-reveal style={{ '--d': '.2s' } as React.CSSProperties}>
              All questions
            </Link>
          )}
        </div>
        <Accordion items={items} defaultOpen={0} className={styles.list} />
      </div>
    </section>
  )
}
