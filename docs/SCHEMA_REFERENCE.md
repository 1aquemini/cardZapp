# cards.csv column definitions

Reference documentation for the data structure used to build out the API and ETL processes.

| Column           | Description                                      |
|------------------|---------------------------------------------------|
| card_id          | Unique sequential ID                              |
| game             | Magic / Pokemon / Yugioh                          |
| card_name        | Card name as printed                              |
| set_name         | Set/edition                                       |
| rarity           | Rarity if applicable                              |
| condition_notes  | Visible wear, centering, surface issues           |
| est_value_low    | Low end of estimate (USD)                         |
| est_value_high   | High end of estimate (USD)                        |
| primary_source   | Which site the estimate leaned on most            |
| last_priced_date | ISO date of last price check (YYYY-MM-DD)         |
| photo_ref        | Filename/label of source photo (not the image)    |

Rows are appended during photo-intake sessions per the project's grading and
pricing workflow. One row per physical card (not per line item).

## How this schema is used:

- **Python ETL** (`src/etl/data_merger.py`): Standardizes column names and loads CSV/XLSX files into the PostgreSQL database
- **API Integrations** (`src/api/`): YGO ProDeck and eBay APIs map market data to `card_id` and `primary_source` fields
- **Frontend** (future): Display card data, update `est_value_*` ranges, and manage photo references
