/** Every event the first-party tracker may record (shared by the browser and /api/track). */
export const TRACK_NAMES = [
  'page_view',
  'product_view',
  'add_to_bag',
  'checkout_view',
  'payment_start',
  'concierge_call',
  'concierge_whatsapp',
  'discovery_waitlist',
  'instagram_click',
  'salon_join',
  'film_play',
  'track_lookup',
  'delivery_check',
  'whatsapp_order',
  'popup_view',
  'finder_start',
  'finder_result',
  'lead_capture',
  'notify_request',
  'upsell_add',
  'bag_reminder',
  'waitlist_join',
] as const

export type TrackName = (typeof TRACK_NAMES)[number]
