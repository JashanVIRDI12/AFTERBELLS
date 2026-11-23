# Waitlist: where the sign-ups go

Every waitlist sign-up is saved in the site's database (Postgres on Neon, set by `DATABASE_URL`).
Nothing else to set up.

## What is saved

One entry per person: when they joined, their WhatsApp number and/or email, their first name and the
fragrances they picked (both optional, added in the second step), and where they came from (e.g. Instagram, a campaign).
If the same person joins again, their entry is updated, not duplicated.

## Seeing the list

- **On the site:** /admin → Leads → **Waitlist**.
- **In Excel:** /admin → Leads → **Waitlist for Excel (CSV)**, then open the file in Excel or Google Sheets.
- **Live in Excel:** Data → Get Data → From Web, enter `https://YOUR-SITE/api/admin/export?type=waitlist`,
  choose **Basic** sign-in with the admin user (`house`, or ADMIN_USER) and ADMIN_PASSWORD, then **Refresh** for the latest list.

## When the site goes live

Add the same `DATABASE_URL` from `.env.local` to the host's environment variables (Vercel → Project → Settings →
Environment Variables), then redeploy. Visit `/api/health`: it should say `"storage":"postgres"`.

If the host has no `DATABASE_URL`, the waitlist (and the other forms) show "We could not save that just now"
instead of pretending to save, so no sign-up is ever lost without anyone noticing.
