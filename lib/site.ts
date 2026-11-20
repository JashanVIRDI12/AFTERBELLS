/**
 * After Bells — house configuration.
 * Everything a non-developer is likely to change lives here or in catalog.ts.
 * Items marked PLACEHOLDER must be confirmed before launch.
 */
export const site = {
  name: 'After Bells',
  tagline: 'Reserved for the Exceptional',
  description:
    'After Bells is a maison de parfum composing for the hour after the bells. The First Edition — Amber Hour, Open Sky and Iron Crown — is finished with 24k gold flakes and available now.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  instagram: 'afterbells',
  /**
   * The concierge: one number, shown everywhere the house can be reached.
   * (The second line, +91 77018 79359, is kept off the site so guests see a single house number.)
   */
  concierge: [{ display: '+91 70155 91455', tel: '+917015591455' }],
  /** WhatsApp chat for the same concierge number: digits only, with country code */
  whatsapp: '917015591455',
  /** Shown on the site only once `emailLive` is true (a real, monitored mailbox) */
  email: 'concierge@afterbells.com', // PLACEHOLDER
  emailLive: false,

  /**
   * Seller details required by the Consumer Protection (E-Commerce) Rules 2020 and the
   * Legal Metrology (Packaged Commodities) Rules. Empty fields are left off the page,
   * so fill every one before launch. Confirm the exact list with your CA or lawyer.
   */
  legal: {
    entity: '', // PLACEHOLDER — registered business name, e.g. "After Bells Fragrances LLP"
    address: '', // PLACEHOLDER — registered address
    gstin: '', // PLACEHOLDER
    /** Who made and packed the perfume (if different from the seller) */
    manufacturer: '', // PLACEHOLDER — name and address
    countryOfOrigin: 'India',
    grievance: { name: '', email: '', phone: '' }, // PLACEHOLDER — grievance officer
  },
  locale: 'en-IN',
  currency: 'INR',

  /** The First Edition: stock limits (internal only, never shown as numbers). */
  edition: {
    name: 'First Edition',
    stockPerFragrance: 300, // PLACEHOLDER — bottles of each fragrance in the First Edition
    /** Bottles already sold outside the website (Instagram, events…) — counted against the stock. */
    soldOffline: { 'amber-hour': 0, 'open-sky': 0, 'iron-crown': 0 },
    /** Say "Few remaining" once stock falls to this share */
    lowStockShare: 0.2,
    maxPerVariant: 3,
  },

  /** Optional part-payment at checkout. Off: orders are paid in full. */
  deposit: { enabled: false, percent: 30 },

  /**
   * The delivery promise. Delhi NCR orders go by a same-city courier (e.g. Shadowfax Prime or
   * Borzo) for next-day delivery; the rest of India by surface express (perfume is a flammable
   * liquid, so most couriers will not fly it). PLACEHOLDER — confirm both with your courier.
   */
  delivery: {
    fast: 'Next-day delivery in Delhi NCR',
    fastPlace: 'Delhi NCR',
    fastShort: 'Arrives tomorrow',
    standard: '3–7 working days across India',
    standardShort: 'Arrives in 3–7 working days',
    /** PIN codes that count as Delhi NCR: Delhi, Gurugram, Faridabad, Noida and Greater Noida, Ghaziabad */
    fastPins: ['110', '1220', '1210', '2013', '2010'],
  },

  shipping: {
    fee: 0,
    note: 'Complimentary insured delivery across India',
  },

  /** Shows the small "drop your file here" hints on empty image/video slots. Turn off at launch. */
  showMediaHints: false,
} as const

export type Site = typeof site

/** The concierge number(s), for sentences */
export const conciergeLine = site.concierge.map((c) => c.display).join(' or ')

/** A WhatsApp chat with the concierge, optionally with a first message already typed */
export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`

/** "20 January" from "20 January 2027": short dates for one-line notes */
export const dayMonth = (label: string) => label.replace(/\s+\d{4}$/, '')

/** Delhi NCR (next-day) or the rest of India, from a six-digit PIN code */
export const isFastPin = (pin: string) => /^\d{6}$/.test(pin) && site.delivery.fastPins.some((p) => pin.startsWith(p))
