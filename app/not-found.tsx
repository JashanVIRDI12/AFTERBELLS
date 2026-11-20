import type { Metadata } from 'next'
import Link from 'next/link'
import { Peacock } from '@/components/brand/Brand'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page does not exist. Return to the After Bells collection.',
}

export default function NotFound() {
  return (
    <section
      data-header="dark"
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeContent: 'center',
        justifyItems: 'center',
        gap: 20,
        padding: '120px var(--gutter)',
        textAlign: 'center',
        background: 'var(--espresso)',
        color: 'var(--ivory)',
      }}
    >
      <Peacock style={{ height: 120 }} shine />
      <p className="t-eyebrow" style={{ color: 'var(--gold-a)' }}>
        404
      </p>
      <h1 className="t-title t-h2">This hour does not exist</h1>
      <p style={{ maxWidth: '38ch', opacity: 0.75 }}>The page you were looking for has slipped away, like the last note after the bells.</p>
      <Link href="/" className="btn btn--gold" style={{ marginTop: 12 }}>
        Return to the house
      </Link>
    </section>
  )
}
