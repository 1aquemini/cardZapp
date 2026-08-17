# CSV column definitions

Reference documentation for the two CSV formats this app reads and writes.
Both live entirely client-side — there is no database, ETL pipeline, or
server. This file previously described a Postgres/Flask backend from an
earlier design; that backend was dropped (see `MERGE_NOTES.md`) and this
doc had drifted out of sync with the shipped app until corrected here.

## Collection schema (`cards.csv` — Collection tab Export/Import)

Source of truth in code: `COLLECTION_COLUMNS` in `index.html`.

| Column            | Description                                                        |
|-------------------|----------------------------------------------------------------------|
| card_id           | Unique ID, generated on add                                        |
| game              | `mtg` / `pokemon` / `ygo`                                          |
| card_name         | Card name as confirmed by the user (not raw OCR output)            |
| set_name          | Set/edition, user-confirmed                                        |
| rarity            | Rarity if applicable                                                |
| print_type        | Normal / Foil / Holo / Reverse Holo / 1st Edition / Promo / Other — always a manual choice, never inferred |
| qty               | Quantity of this exact card (name + set + print_type + condition_tier combination) |
| condition_tier    | Self-assessed tier from `GRADING_REFERENCE.md`                     |
| condition_notes   | Free-text detail (whitening, centering, etc.); prefixed with "Graded: ..." if the card is professionally graded; required detail when print_type is "Other" |
| est_value_low     | Low end of estimate (USD)                                          |
| est_value_high    | High end of estimate (USD)                                         |
| primary_source    | Which comp source the estimate leaned on most                      |
| last_priced_date  | ISO date (YYYY-MM-DD) the estimate was last set                    |
| photo_ref         | Label for the source photo (not the image itself — images aren't stored) |

One row per distinct physical-card scenario. Confirming a card that exactly
matches an existing row (same `card_name` + `set_name` + `print_type` +
`condition_tier`) increases that row's `qty` instead of creating a new row
— see `findDuplicateRow()` / `addToCollection()` in `index.html`.

## For-Sale Archive schema (`for_sale_archive.csv` — For-Sale Archive tab)

Source of truth in code: `FORSALE_COLUMNS` in `index.html`. Simpler and
intentionally separate from the Collection schema — this tab is a
user-imported reference list, not actively managed inventory.

| Column   | Description        |
|----------|---------------------|
| Name     | Listing name        |
| Price    | Asking price (USD)  |
| Quantity | Units listed         |
| Total    | Price × Quantity     |

This archive is per-browser (`localStorage`, own key, separate from the
Collection store) and never auto-populated — see `MERGE_NOTES.md` for why.

## How these are actually used

- **Export CSV / Import CSV** buttons on each tab read/write these exact
  column sets via `parseCSV()` / `rowsToObjects()` in `index.html`.
- Nothing outside the browser ever touches this data. There's no API, no
  ETL step, no server-side processing of either file.
