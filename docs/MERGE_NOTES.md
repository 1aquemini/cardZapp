# Merge notes: Card-Ledger + Card-Library → this repo

This repo replaces two private repos (`Card-Ledger`, `Card-Library`, which
contained a `v2-cardboard-gods` scaffold). Notes on what was flagged,
what was kept, and what was intentionally dropped.

## Structural conflict (flagged before merging)

- **Card-Ledger**: single static `index.html`, `localStorage`, zero
  backend. Deployable on GitHub Pages today.
- **Card-Library / v2-cardboard-gods**: Flask + PostgreSQL + Docker
  Compose backend, scaffolded but not built out — no OCR code, empty
  `data/raw/`, blocked on creating a Neon/Supabase account and an eBay
  developer API key (per its own `CLOSURE_WORKBOOK.csv`).

**These are incompatible with the zero-cost, GitHub-Pages-only constraint.**
GitHub Pages serves static files only — it cannot run Flask or host
Postgres. Keeping that backend alive would require a separately-hosted,
always-on server, which either costs money or relies on a free tier that
sleeps/rate-limits in a way that breaks a "tap and scan" experience. The
eBay integration also requires an OAuth token, which cannot be kept secret
in a pure static/client-side app.

**Decision:** built on Card-Ledger's static architecture. Ported over the
*non-runtime* artifacts from Card-Library that don't require a server:
`SCHEMA_REFERENCE.md` and `GRADING_REFERENCE.md`, kept in `docs/` as design
references the app's CSV schema and condition tiers are built from.
`app.py`, `models.py`, `docker-compose.yml`, `requirements.txt`, and the
eBay/API integration code were **not** carried over — none of it is
executable in a static-hosting environment, and shipping dead server code
in a public repo invites confusion later.

## Fixed: auto-logging without confirmation

The original Card-Ledger `index.html` used `html5-qrcode` as a barcode/QR
scanner. On any successful scan, `onScanSuccess()` called `addItem()`
**immediately** — no review step, no print-type selection, decoded
barcode text used directly as the card name. This violates the
non-negotiable rule that misidentified cards must never be auto-logged.

**Decision:** removed the barcode-scanner flow entirely. Replaced with a
photo → on-device OCR (Tesseract.js) → free public-database lookup →
mandatory human confirmation → print-type selection → condition estimate
→ pricing link-out → confirm-gated log flow. The gate is enforced in code
(`validateBeforeLog()` / `addToCollection()`), and covered by a self-test
that asserts an unconfirmed draft is rejected.

## Logo / icon

Official Pokémon, Yu-Gi-Oh!, and Magic: The Gathering logos were
considered for the home-screen icon and **intentionally excluded** —
they're trademarked by The Pokémon Company/Nintendo, Konami, and Wizards
of the Coast respectively, and bundling them (even in a free personal
project, even in a public repo) risks a takedown. A custom icon was
designed instead: a brass ledger/vault dial with a fanned trio of cards in
garnet, verdigris, and amethyst — signaling "three games, one tracked
collection" without reusing anyone's mark.

## Data

- `ygo_for_sale_inventory.csv` carried over unchanged as ground truth (711
  listings). It is **not** auto-loaded by the app — see "Multi-user
  isolation" below.
- Magic and Pokémon inventory data was not present in either source repo —
  nothing was assumed or fabricated. Add cards for those games through the
  normal Scan & Add flow going forward.

## Multi-user isolation (For-Sale Archive)

The Collection tab was always per-browser via `localStorage`, so two
people using the same deployed link already get fully separate
collections with no code change needed. The For-Sale Archive tab
originally didn't follow that pattern — it `fetch()`ed
`data/ygo_for_sale_inventory.csv` directly out of the public repo on
every page load, so *every visitor*, not just the owner, saw the owner's
711 listings. That's fine for a single-user tool, but breaks down the
moment the link is shared: anyone opening it would see someone else's
private sale inventory and pricing by default.

**Decision:** the archive is now `localStorage`-backed per-user, exactly
like the Collection tab — empty on first load, populated only via an
explicit **Import CSV** action, with matching **Export CSV** and **Clear**
controls. `ygo_for_sale_inventory.csv` stays in the repo as the source
file; the owner (or anyone) loads it in by importing it themselves through
the same control everyone else uses for their own file.
