'use client'

import { useState } from 'react'
import { useCart, useUI } from '@/lib/stores'
import { formatINR } from '@/lib/pricing'
import { useStock } from '@/lib/useStock'
import { track } from '@/lib/track'
import { getVariant } from '@/lib/catalog'

type Props = {
  variantId: string
  price?: number
  label?: string
  className?: string
  variant?: 'gold' | 'line' | 'ink'
  block?: boolean
  openBag?: boolean
}

export default function ReserveButton({
  variantId,
  price,
  label = 'Add to bag',
  className = '',
  variant = 'gold',
  block,
  openBag = true,
}: Props) {
  const add = useCart((s) => s.add)
  const set = useUI((s) => s.set)
  const stock = useStock(variantId)
  const soldOut = stock?.remaining === 0
  const [added, setAdded] = useState(false)

  const onClick = () => {
    add(variantId)
    track('add_to_bag', { slug: getVariant(variantId)?.product.slug })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
    if (openBag) window.setTimeout(() => set({ cartOpen: true }), 260)
  }

  return (
    <button
      type="button"
      className={`btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`}
      onClick={onClick}
      disabled={soldOut}
      aria-live="polite"
    >
      {soldOut ? (
        'Sold out'
      ) : added ? (
        <>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
            <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          Added to bag
        </>
      ) : (
        <>
          {label}
          {price !== undefined && <span aria-hidden>·</span>}
          {price !== undefined && formatINR(price)}
        </>
      )}
    </button>
  )
}
