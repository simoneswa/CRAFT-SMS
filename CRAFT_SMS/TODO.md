# Craft SMS — Requested Changes

## Step 1: Brand color update in global CSS
- [x] Add Craft SMS CSS variables (`--color-*`) into `CRAFT_SMS/frontend/src/app/globals.css`.
- [x] Update `--brand-primary` in `globals.css` to `#3954A5`.
- [ ] Update `--primary/--blue`, `--warning/--yellow`, `--success/--green` if they exist (verify variables first).

## Step 2 update status
- [x] Insert Download section above footer in `CRAFT_SMS/frontend/src/app/page.tsx` (via `DownloadSection` component).
- [x] Hide left/right illustrations on mobile (below md=768px) inside `DownloadSection`.


## Step 2: Add Download section above footer on landing page
- [ ] Insert new “Download Craft SMS Now” section in `CRAFT_SMS/frontend/src/app/page.tsx` immediately above the `<footer>`.
- [ ] Use `/left-characters.png` and `/right-characters.png` assets and hide them below `md` (<768px).
- [ ] Add app badge links from `/app-store-badge.svg` and `/google-play-badge.svg`.

## Step 3: Verification
- [ ] Run `pnpm lint` / `pnpm test` (if available) and ensure build passes.

