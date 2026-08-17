# Card Ledger

A personal trading card inventory and sales-tracking app for **Magic: The
Gathering, Pokémon, and Yu-Gi-Oh** collections. Photo-scan a card, confirm
what it is, price it, log it — all in your browser, all free.

## Zero-cost, by design

No App Store, no developer account, no domain, no hosting bill, no paid
API tier, ever. This is a single static HTML file. It runs entirely in
your browser and installs to your phone's home screen through **Safari →
Share → Add to Home Screen** — that install *is* the app. There is nothing
further to buy or submit for review.

## How the scan flow works

1. **Choose a game** (Magic / Pokémon / Yu-Gi-Oh) so lookup queries the
   right free card database.
2. **Take or upload a photo.** OCR runs on-device via Tesseract.js — no
   image is uploaded anywhere.
3. **Confirm the identification.** As you type, matches appear live from a
   free public card database (Scryfall for Magic, pokemontcg.io for
   Pokémon, YGOPRODeck for Yu-Gi-Oh) — no need to finish typing or tap
   search first. Each match shows a thumbnail so you're confirming by
   sight, not just text. **Nothing is logged automatically** — you pick
   the right match or type it in yourself. Selecting a match also
   populates the Set field with real matching sets to choose from.
4. **Print type is always a manual choice** — Normal / Foil / Holo /
   Reverse Holo / 1st Edition / Promo. Foil can't be reliably detected
   from a flat photo, and foil/normal prices differ substantially, so this
   is never inferred for you.
5. **Condition** is a self-assessed estimate against the tiers in
   [`docs/GRADING_REFERENCE.md`](docs/GRADING_REFERENCE.md) — always a
   photo-based estimate, never a certified grade. If the card is
   professionally graded (PSA/BGS/CGC/etc.), there's a separate optional
   field for that instead of forcing it into the raw-condition scale.
6. **Pricing** is link-out only: buttons open pre-filled searches on
   TCGplayer, eBay sold listings, and StarCityGames. Nothing is
   auto-fetched or auto-refreshed — you look, you decide the value.
7. Only after you tap **Confirm & add to collection** does a row get
   written to your local collection.

This order is intentional: a misidentified card inflates collection value
and breaks the point of tracking it, so confirmation is a hard gate in the
code (see `validateBeforeLog` / `addToCollection` in `index.html`), not a
suggestion.

Confirming a card that exactly matches one already logged (same name, set,
print type, and condition tier) increases that row's quantity instead of
creating a duplicate row — a second copy of a card you already have won't
fork your collection into near-identical entries.

## Data & storage

- Your logged collection lives in this browser's `localStorage` only.
  Nobody else can see it, and it doesn't sync between devices on its own.
- **Export CSV** / **Import CSV** on the Collection tab is how you back up
  or move data between devices — the column layout matches
  [`docs/SCHEMA_REFERENCE.md`](docs/SCHEMA_REFERENCE.md).
- The **For-Sale Archive** tab works the same way: empty by default for
  every visitor, populated only when *they* tap Import CSV and choose a
  file. Nothing is bundled or auto-loaded — if you share this app's link
  with someone else, they get their own empty archive, not yours.
  `data/ygo_for_sale_inventory.csv` in this repo is the source file for
  the owner's own 711-listing archive; import it yourself from the
  For-Sale Archive tab to load it into your own browser's storage the
  same way anyone else would import theirs. Expected columns: `Name,
  Price, Quantity, Total`.

## Deploying it (pick one — both are free)

### Option A — GitHub Pages
1. Push this repo's contents to a **public** GitHub repository (Pages'
   free tier requires public).
2. Repo Settings → Pages → Deploy from branch → `main` / root.
3. Visit the published `https://<username>.github.io/<repo>/` URL on your
   iPhone in Safari → Share → **Add to Home Screen**.

   ⚠️ **Privacy note:** a public repo means your app's *code* is public.
   Your actual card collection is **not** in the repo — it lives only in
   your phone's local browser storage — but keep this in mind if you ever
   commit an exported `cards.csv` into the repo itself.

### Option B — Fully local, fully private
1. AirDrop or copy this whole folder onto your iPhone via the Files app.
2. Open `index.html` in Safari from the Files app.
3. Share → **Add to Home Screen**.

Camera access (`<input type="file" accept="image/*" capture="environment">`)
works in both paths inside an installed PWA on iOS Safari — no native code
required.

## Self-tests

The **About / Docs** tab has a "Developer tools" section with a
**Run self-tests** button. It validates, with plain assertions and no
camera or network calls required:

- the confirmation gate rejects unconfirmed or incomplete rows
- print type is required before anything logs
- foil/normal print types never silently merge into one row
- CSV export/import round-trips correctly, including comma/quote escaping
- localStorage persistence survives a save/reload cycle
- the OCR name-guess heuristic and HTML-escaping helpers behave correctly

Open with `?test=1` in the URL to auto-run these on page load.

## Repo layout

```
index.html                     the entire app
manifest.json                  PWA manifest
apple-touch-icon.png           iOS home-screen icon
icons/                         192 / 512 / maskable PWA icons
data/ygo_for_sale_inventory.csv   owner's source file — import via the For-Sale Archive tab
docs/GRADING_REFERENCE.md      condition/grading tiers
docs/SCHEMA_REFERENCE.md       cards.csv column definitions
docs/MERGE_NOTES.md            what changed when this repo was consolidated
```

## What this app deliberately does not do

- No account system, no login, no server, no database.
- No automatic price refresh — pricing is a manual link-out lookup you
  control, every time.
- No official Pokémon / Yu-Gi-Oh / Magic trademarked logos or card art in
  the app icon or UI — those are trademarked by their respective owners,
  and bundling them risks a takedown even in a free/personal project. The
  icon is an original design instead (see `docs/MERGE_NOTES.md`).
