import { z } from 'zod'
import { INDIAN_STATES } from './india'
import { site } from './site'

/** Shared by the checkout form (client-side hints) and the API (authoritative). */
export const customerSchema = z.object({
  email: z.email('Enter a valid email address').max(120),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number')),
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  address1: z.string().trim().min(4, 'Enter your address').max(140),
  address2: z.string().trim().max(140).optional().default(''),
  city: z.string().trim().min(2, 'Enter your city').max(60),
  state: z.enum(INDIAN_STATES, { message: 'Choose your state' }),
  pin: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a 6-digit PIN code'),
})

export const checkoutSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().min(1).max(60),
        qty: z.number().int().min(1).max(site.edition.maxPerVariant),
      }),
    )
    .min(1, 'Your bag is empty')
    .max(10)
    .refine((lines) => new Set(lines.map((line) => line.variantId)).size === lines.length,
      'Each fragrance may appear only once in your bag'),
  plan: z.enum(['full', 'deposit']).default('full'),
  customer: customerSchema,
  gift: z
    .object({ message: z.string().trim().max(240, 'Keep your message under 240 characters') })
    .optional(),
  acceptTerms: z.literal(true, { message: 'Please accept the terms of sale' }),
  whatsappUpdates: z.boolean().optional().default(false),
  origin: z
    .object({
      source: z.string().trim().max(80).optional(),
      medium: z.string().trim().max(80).optional(),
      campaign: z.string().trim().max(80).optional(),
    })
    .optional(),
})

export type CheckoutInput = z.input<typeof checkoutSchema>
export type CustomerInput = z.input<typeof customerSchema>
