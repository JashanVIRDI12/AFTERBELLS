import { priceLines, type Line } from './pricing'
import { whatsappLink } from './site'

/**
 * A WhatsApp chat with the concierge with the bag already written out, for guests who would
 * rather order by message (the concierge records it as a manual order in /admin).
 */
export function whatsappOrderLink(lines: Line[], opts: { pin?: string; number?: string } = {}) {
  const items = priceLines(lines)
    .lines.map((l) => `${l.name}${l.size ? ` ${l.size}` : ''} × ${l.qty}`)
    .join(', ')
  const text = [
    opts.number
      ? `Hello After Bells, I would like help completing order ${opts.number} (${items}).`
      : `Hello After Bells, I would like to order: ${items}.`,
    opts.pin ? `Delivery PIN code: ${opts.pin}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
  return whatsappLink(text)
}
