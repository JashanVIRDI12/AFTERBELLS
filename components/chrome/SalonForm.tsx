'use client'

import ContactCapture from '@/components/lead/ContactCapture'

/** The house letters, by email or WhatsApp. */
export default function SalonForm() {
  return (
    <ContactCapture
      kind="salon"
      salon
      start="email"
      tone="dark"
      cta="Keep me informed"
      note="New hours and invitations from the house, once a month at most. Leave whenever you like."
      thanks={(via) => (via === 'email' ? 'You are on the list. Watch your inbox for letters from After Bells.' : 'You are on the list. The house will write to you on WhatsApp.')}
    />
  )
}
