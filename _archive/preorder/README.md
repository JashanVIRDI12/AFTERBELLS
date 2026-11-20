# Preorder (archived 18 Nov 2026)

The site launched as direct sale instead of preorder. These files are the preorder page
(`/preorder`), its sections, the countdown and the close-date logic, kept here in case a
future edition opens by preorder again. They are outside `app/` and excluded from TypeScript,
so they are not built. To restore: move `app-preorder` back to `app/preorder`,
`components-preorder` to `components/preorder`, `Countdown.*` to `components/ui/`,
`preorder.ts` to `lib/`, and restore the `preorder` block in `lib/site.ts`.
