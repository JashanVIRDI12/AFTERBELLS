import type { Metadata } from 'next'
import { detailsOf, getSession, memberData } from '@/lib/account'
import CheckoutForm from '@/components/checkout/CheckoutForm'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
}

export default async function CheckoutPage() {
  // signed in: start from their saved profile, or their last order's details
  const email = await getSession()
  let initial
  if (email) {
    const { profile, fallback } = await memberData(email)
    initial = { email, ...detailsOf(profile ?? fallback) }
  }
  return <CheckoutForm initial={initial} />
}
