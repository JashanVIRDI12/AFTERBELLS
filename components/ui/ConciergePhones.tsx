import { site } from '@/lib/site'

/** The concierge's numbers as tap-to-call links, joined with "or". */
export default function ConciergePhones({ className }: { className?: string }) {
  return (
    <>
      {site.concierge.map((c, i) => (
        <span key={c.tel}>
          {i > 0 && ' or '}
          <a href={`tel:${c.tel}`} className={className} style={{ whiteSpace: 'nowrap' }}>
            {c.display}
          </a>
        </span>
      ))}
    </>
  )
}
