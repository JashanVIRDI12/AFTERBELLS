# After Bells website audit

Reviewed 16 November 2026. Scope: all application routes, shared components, media slots, product
pages, bag, checkout, order confirmation, feedback, newsletter, policies, metadata, stock,
payment handlers and storage. Changes were made in the existing local Next.js checkout.

## Reference review and photography direction

The official reference sites were reviewed as benchmarks for presentation and product storytelling:

| Reference | Observed pattern | Applied to After Bells |
| --- | --- | --- |
| [Amouage](https://amouage.com/) | Campaign chapters, collection discovery and house storytelling | Distinct light and material direction for each fragrance, plus house and collection imagery |
| [Creed Aventus](https://creedboutique.com/products/aventus) | Multiple product images and prominent fragrance-family information | Bottle portraits, material macros and ingredient scenes alongside the existing notes |
| [Louis Vuitton perfumes](https://in.louisvuitton.com/eng-in/perfumes/icons/_/N-t1ve5yn0-cph63i0x) | Product imagery connected to a fragrance's emotional story | Restrained editorial scenes that support dusk, dawn and midnight |

These are original After Bells compositions. The source bottle sheets determine the flacon,
ornate square gold cap, uppercase front label, glass base and liquid colours. No reference-house
branding or product designs were substituted.

## Media delivered

The initial delivery filled the 17 original media slots: 15 generated photographs/cutouts, one supplied
video and one frame extracted from that video. A further social image is derived from the original
collection photograph. Subsequent photography updates are recorded below.

| Assets | Uses |
| --- | --- |
| Three transparent bottle cutouts | Homepage collection panels; real RGBA transparency, with no rectangular studio backdrop |
| Three studio bottle portraits | Product galleries, related fragrances, bag, checkout and product social metadata |
| Three glass/gold macro photographs | Product galleries, replacing side/three-quarter bottle views |
| Three ingredient still lifes | Product galleries |
| One three-bottle collection campaign | Homepage collection band and social share image |
| One engraved-cap editorial | House section and product finishing sections |
| One raw-material editorial | House section |
| Supplied 1920×1080, 15.008-second film | Homepage background and full-film dialog |

The earlier small gold flakes are retained following the owner's final direction. Enlarged-flake
experiments and side-view variants are excluded from the delivered website assets.

Web assets: `public/media/`. PNG originals: `output/imagegen/`. Exact selected prompts and provenance:
`output/imagegen/prompts.json`. Generation used the built-in image generation tool; WebP conversion
preserves alpha for cutouts. Photography ranges roughly 140–340 KB per WebP; the supplied video is
about 9.3 MB. Images load responsively through Next Image, while small bag/checkout thumbnails use
the same product photographs.

## Issues fixed

| Finding | Result |
| --- | --- |
| Every photo/video slot initially empty | Complete media set connected; internal file hints hidden |
| Framed studio images looked pasted onto collection sections | Dedicated transparent cutouts sit directly on the section backgrounds |
| Hero film absent | Supplied film connected, with poster, muted inline playback, play/pause and full-film viewing |
| Supplied film ends in a black tail | Background loop returns to the start after the filmed sequence; original full film retained in dialog |
| Ambient overlays obscured real product photography | Synthetic hero overlays and product-gallery flakes removed from photographed areas |
| Bag and checkout showed label artwork | Matching bottle photographs now used |
| Product structured data/social metadata used label artwork | Actual product photography in product JSON-LD, Open Graph and Twitter metadata |
| Gallery used incomplete tab semantics | Labeled image-selection buttons expose their pressed state |
| Hidden sticky reserve remained keyboard focusable | Hidden bar is inert |
| Menu, bag and film dialog lacked focus containment/restoration | Background made inert, focus contained, Escape closes, opener restored |
| Mobile menu trigger lacked a reliable accessible name | Explicit Open/Close menu labels added |
| Closed FAQ answers remained exposed | Hidden answers receive hidden/inert accessibility semantics |
| Collapsed mobile checkout summary retained focusable controls | Hidden summary is inert and excluded from the accessibility tree |
| Feedback ratings overflowed at 320px | Ratings stack beneath their labels while preserving 44px controls |
| Image reveals depended entirely on hydration | No-JavaScript and reduced-motion visibility fallbacks added |
| Deprecated Next Image priority usage | Updated to the installed Next version's preload API |
| Replaced photography could remain in the image optimizer cache | Media URLs include the source-file revision |
| Repeated checkout IDs bypassed per-fragrance limits | Schema rejects duplicate variant IDs |
| Missing gateway keys silently enabled unpaid demo reservations | Explicit local-development opt-in required; production demo completion blocked |
| Network errors could leave feedback/payment confirmation busy | Error recovery restores a usable state and retains context |
| Reserve state did not update at the preorder deadline | Live deadline check keeps reserve availability current |

## Outstanding launch requirements

1. **Transactional stock and durable production storage.** The current stock read and pending-order
   creation are separate operations. Simultaneous last-bottle requests can oversell. JSON storage
   and process-local locks support a single persistent server, not distributed/serverless instances.
   Before live commerce, move stock checking and reservation-hold creation into a database transaction.
   Existing JSON reads also treat every read/parse failure as an empty store; fail on corruption or
   permission errors instead of allowing a later write to replace existing records.
   **Resolved (16 Nov 2026):** Postgres storage via `DATABASE_URL`; stock check and reservation run in one
   transaction under an advisory lock (tested: 10 parallel checkouts for the last 2 bottles → exactly 2 succeed);
   the file store now refuses to overwrite unreadable files.
2. **Confirm product and fulfilment facts.** Bottle volumes remain blank. Catalogue descriptions,
   concentration, edition size, preorder closing/dispatch dates, contact address, delivery promises
   and cancellation/refund terms contain existing draft or unconfirmed values. They were preserved
   for owner review. In particular, confirm `lib/site.ts`, `lib/catalog.ts`, `lib/content.ts` and
   `app/policies/page.tsx` before taking reservations.
3. **Verify live integrations in the launch environment.** Configure the final canonical URL,
   Razorpay account/webhooks, email sender and persistent storage. Complete a gateway test-mode
   checkout and webhook reconciliation, including failure and delayed-confirmation cases. No real
   payment, customer email or customer-data record was created during this audit.
4. **Device coverage.** Browser QA uses desktop Chrome with mobile viewports. Real iOS/Safari
   autoplay, touch behaviour, screen-reader announcements and payment-provider UI still need a
   device pass. The supplied landscape film is responsively cropped on narrow screens.

## Verification

- Production Next.js build and TypeScript check completed successfully.
- Schema checks cover duplicate lines, quantity limits and valid distinct variants.
- Payment-mode checks cover production rejection and explicit development opt-in.
- All cutout PNGs were checked for a genuine alpha channel containing transparent and opaque pixels.
- Browser results and review screenshots are recorded in `output/audit/`.
- Public route/status checks, six-page responsive checks at 320/390/768/1440px, mobile gallery,
  bag/checkout photography, menu focus containment, film controls, FAQ semantics, reduced-motion
  playback and loaded-media checks passed with no uncaught browser errors.
- No production deployment or live payment was performed.

The repository has no pre-existing test suite. Browser checks are reproducible with
`node output/audit/run-browser-checks.cjs` while the app runs; set `PLAYWRIGHT_PATH` to an installed
Playwright package and `AUDIT_URL` if the local environment differs.

## Photography update · 16 November 2026

- The homepage first-edition band now uses `collection-trio-v2.webp`, a new 1536 × 1024 three-bottle
  photograph on stepped brown limestone. The copy sits beside the image. The photograph displays
  at a maximum 720 CSS pixels wide, with no crop, zoom, parallax or dark overlay; the original has
  enough pixels for a 2× Retina display at that size.
- The shared Salon invitation uses a dedicated espresso silk and honed-stone photograph,
  `salon-backdrop.webp`. The previous video-poster background and CSS blur were removed.
- Original PNGs and both exact generation prompts are in `output/imagegen/`; the prompt set is
  `latest-imagery-prompts.json`. Both photographs were generated with the built-in image tool.
- Production build passed. Browser checks at 320, 390, 768, 900, 1440 and 1920 CSS pixels, using
  2× density, passed without horizontal overflow or uncaught errors. The trio remains uncropped;
  the Salon email field and button fit every tested width. The shared background also loads on
  the collection page. Results and screenshots: `output/audit/image-refresh-results.json` and
  `output/audit/*-refreshed-*.png`.

## House page photography · 16 November 2026

Six dedicated photographs now fill the House page: an opening bottle portrait, a perfumer's bench,
small gold flakes above the glass base, the detached engraved cap, the front gold metal label and
a quiet stone/amber-light closing background. The original product sheet informed the bottle,
cap, front label and small flakes. The four craft photographs retain their native 2:3 proportions,
with a maximum display width of 512 CSS pixels for 2× resolution. The hero keeps the complete
bottle clear of the opening copy, with separate image and text areas on phones.

House-only slots preserve the existing homepage gold photograph and product gallery assets.
The supplied video and bottle cutouts remain in use. Originals, exact built-in generation prompts
and provenance: `output/imagegen/house/`. Download bundle: `output/imagegen/house-images.zip`.

Production build and TypeScript passed. House-page browser checks at 320, 390, 768, 1000, 1440
and 1920 CSS pixels passed with loaded photographs, correct chapter/image pairings, no horizontal
overflow and no uncaught errors. Normal-motion checks confirm that each chapter photograph
settles without enlargement. Results: `output/audit/house-images-results.json` and
`output/audit/house-images-normal-motion.json`.

## House campaign and story update · 17 November 2026

The House opening now uses an edge-to-edge photographic background of an adult model applying
Amber Hour. A dedicated wide desktop composition and vertical phone composition preserve the
face, hand, bottle and spraying gesture, with live copy over quiet areas of each photograph.
The optimized responsive picture chooses the phone image below 768 CSS pixels. The final images
have no baked-in headline or button. The earlier framed portrait is no longer used in the page.

An original story section develops the existing After Bells concept through dusk, dawn and
midnight. Official Amouage, Creed, Clive Christian and Louis Vuitton house pages informed the
editorial structure; references and final copy are in `output/imagegen/house/house-story-notes.md`.
The label chapter and all label-size callouts in application copy have been removed. The craft
sequence now covers composition, gold and the engraved cap.

The built-in image tool generated the campaign photographs. Selected originals, prompts and
research/copy notes are bundled in `output/imagegen/house-full-background.zip`. The production
build and TypeScript check passed. Browser checks across eight desktop/tablet/phone viewport
combinations verified full image coverage, correct responsive sources, visible face/bottle,
readable phone text below the gesture, working story navigation, three craft chapters and no
horizontal overflow or uncaught errors. Results: `output/audit/house-full-background-results.json`.
