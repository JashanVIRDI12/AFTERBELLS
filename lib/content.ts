import { conciergeLine, site } from './site'

/** Copy blocks that are likely to be edited. Items marked PLACEHOLDER describe policy — confirm before launch. */

/** With every order, with the house's compliments. Shown on the home page, product pages, bag, checkout and emails. */
export const compliments = [
  {
    key: 'vials',
    title: 'Three 2 ml vials',
    body: 'Of the First Edition, to meet the other hours.',
  },
  {
    key: 'delivery',
    title: 'Complimentary delivery',
    body: 'Insured and tracked, to your door.',
  },
  {
    key: 'concierge',
    title: 'Priority concierge',
    body: 'Your calls and messages are answered first, before your order and long after it.',
  },
] as const

/** The vials, said on their own */
export const vials = {
  title: 'Three 2 ml vials',
  body: 'Three 2 ml vials of the First Edition travel with every order.',
} as const

/** The discovery set is not on sale yet: guests can ask to be told when it is. */
export const discovery = {
  title: 'The discovery set',
  body: 'All three hours in 2 ml vials, to try before a full bottle.',
} as const

/** What happens after an order, on the confirmation page */
export const nextSteps = [
  { no: 'I', title: 'Packed', body: 'Your bottle is sealed and packed with our thank-you card and three 2 ml vials.' },
  { no: 'II', title: 'Dispatched', body: 'Tracking details reach you by email the day it leaves the house, and on WhatsApp if you asked for it.' },
  { no: 'III', title: 'Delivered', body: `${site.delivery.fast}; ${site.delivery.standard} elsewhere.` },
]

/** One line under every Add to bag button */
export const deliveryNote = `${site.delivery.fast} · ${site.delivery.standard}`

export const faqs: { q: string; a: string }[] = [
  {
    q: 'When will my order arrive?',
    a: `${site.delivery.fast}; ${site.delivery.standard} elsewhere. Enter your PIN code on any fragrance page to see your date. Delivery is complimentary, and tracking details reach you by email (and WhatsApp, if you ask at checkout) the day your bottle leaves us.`,
  },
  {
    q: 'Can I try them before a full bottle?',
    a: 'Yes. Each hour also comes in a 15 ml bottle at ₹799, and every order carries three 2 ml vials so you can meet the other hours. A discovery set of all three in 2 ml vials is coming soon.',
  },
  {
    q: 'How strong are they?',
    a: 'Each perfume is made at 20% perfume oil concentration, available in 60 ml and 15 ml bottles, for a rich trail and long wear on skin.',
  },
  {
    q: 'How is it priced so fairly for a fragrance of this quality?',
    a: 'We sell only from this house, with no shops or agents in between. So the price pays for the perfume.',
  },
  {
    q: 'Which one should I choose?',
    a: `Answer three questions under Find your hour on the Collection page and we will match you to one. Or tell our concierge on ${conciergeLine} what you wear now, and we will suggest the hour for you.`,
  },
  {
    q: 'Who are the perfumes for?',
    a: 'Everyone. Every After Bells perfume is universal, composed to be worn by anyone, at any age, by day or by night.',
  },
  {
    q: 'What comes with every order?',
    a: `Three 2 ml vials of the First Edition, complimentary insured delivery, and priority concierge on ${conciergeLine}, by call or WhatsApp.`,
  },
  {
    q: 'Will the First Edition be made again?',
    a: 'No. Each fragrance in the First Edition is made once and not remade. When it sells out, it closes.',
  },
  {
    q: 'What are the gold flakes inside the bottle?',
    a: 'Every After Bells bottle carries flakes of 24-karat gold suspended in the fragrance. They are purely decorative — they settle when the bottle is still; turn it gently and watch them drift.',
  },
  {
    q: 'How do I pay?',
    a: 'Securely through Razorpay: UPI, all major debit and credit cards, net banking and popular wallets. Your order is paid in full at checkout.',
  },
  {
    q: 'Can I change or cancel my order?',
    a: `Yes, until it is dispatched. Call or WhatsApp our concierge on ${conciergeLine} with your order number and we will amend it or refund it in full.`,
  },
  {
    q: 'Can I order on WhatsApp?',
    a: `Yes. Message or call our concierge on ${conciergeLine} with the fragrances you would like. We take the order, send you payment details and arrange delivery, with the same vials and complimentary delivery as online.`,
  },
  {
    q: 'Do you offer cash on delivery?',
    a: 'Not at present. Orders are paid securely online through Razorpay, by UPI, card, net banking or wallet, and you can cancel free of charge until dispatch.',
  },
  {
    q: 'How do I track my order?',
    a: 'Use the tracking link in your dispatch email, or enter your order number and email under Track your order on the Client care page. If you have an account, every order is in it.',
  },
  {
    q: 'What if my parcel arrives damaged?',
    a: 'Photograph the parcel and the bottle and send the photographs to our concierge on WhatsApp within 48 hours of delivery. We will replace it. For reasons of hygiene, opened bottles cannot be returned.',
  },
  {
    // PLACEHOLDER policy
    q: 'Do you ship outside India?',
    a: 'For the First Edition we ship within India only, with complimentary insured delivery. International shipping will follow.',
  },
  {
    q: 'Can I send it as a gift?',
    a: 'Of course. Add a gift message at checkout and we will write it inside the thank-you card. Prices never appear in the parcel.',
  },
]
