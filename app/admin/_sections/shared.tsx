import type { OrderStatus } from '@/lib/db'

export const LABEL: Record<OrderStatus, string> = {
  pending: 'Awaiting payment',
  failed: 'Payment failed',
  paid: 'Paid · to dispatch',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
export const fmtDay = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/** Hidden field that tells an action which admin view to return to. */
export function Back({ q }: { q: string }) {
  return <input type="hidden" name="back" value={q} />
}

export const PAY_METHODS = ['UPI', 'Cash', 'Bank transfer', 'Card (in person)', 'Other']
