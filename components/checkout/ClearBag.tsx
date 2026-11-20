'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/stores'

/** Empties the bag once a paid confirmation page is shown (covers webhook-confirmed returns too). */
export default function ClearBag() {
  useEffect(() => {
    void Promise.resolve(useCart.persist.rehydrate()).then(() => useCart.getState().clear())
  }, [])
  return null
}
