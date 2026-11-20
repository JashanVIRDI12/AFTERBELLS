# After Bells — Maison de Parfum

Preorder storefront for the After Bells First Edition: **Amber Hour**, **Open Sky** and **Iron Crown**.
Next.js 16 · React 19 · GSAP + Lenis motion · Razorpay checkout · prices in ₹ (inclusive of taxes).

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
```

---

## 1. Add your photos and film (no code needed)

Every image and video on the site is a **slot**. The supplied film and the completed photography
are connected in `public/media/`. Full-resolution PNG originals and the exact built-in image generation
prompts are saved in `output/imagegen/`. The collection uses transparent bottle cutouts; product pages
use the studio portraits, gold-flake macro details and ingredient still lifes.

Drop a file named after the slot into **`public/media/`** — e.g. `public/media/amber-hour-bottle.jpg` —
and it appears automatically (restart `pnpm dev`/rebuild for production).
Images: `.avif .webp .jpg .jpeg .png` · Video: `.mp4 .webm`

| Slot | Where it shows | Ratio | Brief |
| --- | --- | --- | --- |
| `hero-film` (video) | Home hero background + "Watch the film" | 16:9 | 10–30s loop, muted, MP4 H.264, 1920×1080 |
| `hero-poster` | First frame while the film loads | 16:9 | Still from the film |
| `hero-film-mobile` (video) | Home hero + "Watch the film" on phones (portrait screens) | 9:16 | Launch reel, trimmed before the end card, H.264 720×1280 |
| `hero-poster-mobile` | First frame on phones | 9:16 | First frame of the reel |
| `amber-hour-cutout` / `open-sky-cutout` / `iron-crown-cutout` | Home collection panels | 4:5 | Front bottle on genuine transparent alpha |
| `amber-hour-bottle` | Collection chapter, product page (1st) | 4:5 | Hero bottle, front-on, label visible |
| `amber-hour-detail` | Product page (2nd) | 4:5 | Macro: gold flakes through the thick glass base |
| `amber-hour-mood` | Product page (3rd) | 4:5 | Orange blossom, cinnamon, vanilla, dusk light |
| `open-sky-bottle` / `-detail` / `-mood` | as above | 4:5 | Citron, sage, cut grass, open road at dawn |
| `iron-crown-bottle` / `-detail` / `-mood` | as above | 4:5 | Frankincense smoke, myrrh, cedar, midnight |
| `collection-trio` | Homepage band before the FAQ | 16:9 | All three bottles together |
| `maison-atelier` | The House and product finishing sections | 3:4 | Engraved gold cap editorial |
| `maison-materials` | The House section | 4:5 | 24k gold leaf, frankincense, vanilla, citrus |
| `house-hero` | The House page opener | 16:9 | Bottle on limestone in the last light of dusk (borrows `hero-poster` until supplied) |
| `house-composition` | The House page, chapter II | 4:5 | Perfumer's bench: blotters, vials, raw materials (borrows `maison-materials`) |
| `house-gold` | The House page, chapter III | 4:5 | Macro: 24k gold flakes drifting in the perfume (borrows `amber-hour-detail`) |
| `house-label` | The House page, chapter III (small) | 4:5 | Macro: the 2 × 2 cm gold metal label (borrows `iron-crown-bottle`) |
| `collection-hero` | Collection page opener | 16:9 | The three bottles in a row, warm light (borrows `collection-trio`) |

`showMediaHints` is disabled. The original flake size is retained; no side or three-quarter gallery
photographs are used. Product labels appear only on the front. The hero skips the supplied film's black
ending when looping, and offers play/pause controls and a still poster for reduced-motion visitors.

## 2. What to edit, where

| File | What lives there |
| --- | --- |
| `lib/site.ts` | Edition size, close date, dispatch date, deposit option, shipping note, email, Instagram, `reservedOffline` stock |
| `lib/catalog.ts` | Fragrances: prices, notes, copy, colours, **bottle size** (`size: ''` → set e.g. `'50 ml'`) |
| `lib/content.ts` | Preorder steps and FAQ |
| `app/policies/page.tsx` | Preorder terms, shipping, privacy (**draft — have it reviewed**) |

## 3. Payments (Razorpay)

1. Copy `.env.example` → `.env.local` (or set the variables on your host).
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (Dashboard → Account & Settings → API Keys).
   Start with **test keys** (`rzp_test_…`) and place a test order before switching to live keys.
3. Webhook: Dashboard → Webhooks → `https://<your-domain>/api/razorpay/webhook`, events
   `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.failed`;
   copy its secret into `RAZORPAY_WEBHOOK_SECRET`. The webhook confirms orders even if a guest
   closes the tab mid-payment, and records when refunds settle.

Prices are always recalculated on the server from `lib/catalog.ts`; the browser can't change them.
Payment signatures are verified server-side. For local testing without keys, set
`ALLOW_DEMO_PAYMENTS=true` and run `pnpm dev` (demo payments never work in production).

## 4. Database

| | Where data lives |
| --- | --- |
| `DATABASE_URL` set | **Postgres** — production. Neon or Supabase (use the *pooled* connection string), Railway, Render, RDS… Tables (`ab_orders`, `ab_subscribers`, `ab_feedback`) are created automatically on first request. |
| not set | JSON files in `/.data` (or `DATA_DIR`) — local development, or a single server with a persistent disk. |

On serverless hosts (Vercel, Netlify) without `DATABASE_URL`, checkout **refuses to take payments**
rather than lose orders, and `/admin` shows a warning. `GET /api/health` reports which store is in use
(point an uptime monitor at it).

## 5. Limited production (live stock)

Each fragrance is capped at `editionSize` bottles (`lib/site.ts`). Paid, dispatched and delivered
orders hold stock, as do 30-minute holds while a guest is paying. The stock check and the reservation
happen in **one locked step**, so two guests can never be sold the same last bottle. Cancelling an
order returns its bottles immediately. Guests only see words ("Limited production", "Few remaining");
exact numbers appear only in `/admin`. Sold something elsewhere? Add it to `reservedOffline`.

## 6. Emails (Resend)

Set `RESEND_API_KEY` and `EMAIL_FROM` (verify your domain at [resend.com](https://resend.com)).
Guests receive: **confirmation** (on payment), **on its way** (when you mark an order dispatched,
with courier, tracking number and link) and **cancelled** (with refund details). `ORDER_NOTIFY_EMAIL`
gets a copy of every paid reservation. Emails end with the concierge telephone numbers (`site.concierge`).

## 7. Admin — `/admin`

Set a long `ADMIN_PASSWORD` (user defaults to `house`). Admin is disabled while it is empty.

- **To dispatch → Dispatched → Delivered** tabs, plus Cancelled, Unpaid and All.
- **Mark dispatched**: courier, tracking number, optional tracking link; emails the guest.
- **Cancel reservation**: optional full **refund through Razorpay** (demo orders are recorded for a
  manual refund); the guest is emailed and the bottles return to the edition.
- **House notes** (private), **resend confirmation**, the guest's order page, an event timeline per order.
- Edition stock, revenue, refunds, Salon members, feedback averages, and CSV exports.

## 8. Guests

- `/order/<id>` — their reservation: Reserved → Dispatched → Delivered, tracking link, or cancellation.
- `/client-care#track` — **Track your reservation** with reservation number + email.
- `/feedback` — the digital twin of the printed feedback card (point the card's QR code here).

Public forms (Salon, feedback, tracking, checkout) are rate-limited and carry a spam honeypot.

## 9. Deploying (recommended: Vercel + Neon)

1. Push this folder to a private GitHub repository.
2. [neon.tech](https://neon.tech) → create a project (region: Mumbai/Singapore) → copy the **pooled**
   connection string. (Or add Neon from the Vercel Marketplace, which sets `DATABASE_URL` for you.)
3. [vercel.com](https://vercel.com) → Import the repository → add the environment variables from
   `.env.example` (`DATABASE_URL`, Razorpay keys, Resend, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`).
4. Deploy, connect your domain, then visit `/api/health` — it should say `"storage":"postgres"`.
5. Add the Razorpay webhook (section 3), place a test order with test keys, dispatch it from `/admin`,
   then switch to live keys.

Any Node host works too (Railway, Render, a VPS): `pnpm build && pnpm start`. Plain PHP/cPanel
"public_html" hosting cannot run this site — it needs Node.js.

### Before launch

- Fonts: buy the commercial web licence for Rossanova (the brand-kit file is "Personal Use").
- Confirm in `lib/site.ts`: concierge numbers (`concierge`), close and dispatch dates, edition size, shipping note.
- Confirm bottle size (ml) in `lib/catalog.ts`, and have `app/policies/page.tsx` reviewed.
- Complimentary vials and free delivery are promised on the Collection page — keep them true.
- Replace borrowed photographs using the shot list (section 1).

## Brand notes

- Gold `#DEBC68 → #AC8028`, text `#271D0C`, ivory `#F6EEE4`, espresso `#2A211A`.
- Fonts: **Rossanova** (from the logo kit) for titles, **Poppins** for names & body. The site serves
  `app/fonts/Rossanova-Regular.woff2`, a subset of the brand-kit file. That file has placeholder
  boxes for numerals, so digits are left out and figures fall back to Poppins.
  **The brand-kit file is the "Personal Use" licence: buy the commercial/web licence before launch.**
- Every perfume is 20% perfume oil and universal. Edition sizes and stock counts are never shown
  publicly ("Limited production" / "Few remaining" wording only); `editionSize` is the internal cap.
- Logo, emblem and peacock are traced from `After-Bells_Logo-Final_16092026.pdf` (`public/brand/`).
- The reference fragrances behind each note pyramid are intentionally **not named anywhere on the site**.
