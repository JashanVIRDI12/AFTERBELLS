import type { Metadata } from 'next'
import FeedbackForm from '@/components/checkout/FeedbackForm'

export const metadata: Metadata = {
  title: 'Your feedback',
  description: 'Tell After Bells how your fragrance wears — scent, longevity and packaging.',
}

export default function FeedbackPage() {
  return <FeedbackForm />
}
