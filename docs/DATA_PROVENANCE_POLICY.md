# Catalog provenance and promotion policy

The user-supplied 30-page aircon_thailand_2026_v2 report is a dated discovery/enrichment snapshot, not ground truth. Report price and feature indicators never certify runtime fields. The reported 362 entries include bundles, color groups and ambiguous family codes; do not label all entries as unique verified products.

## Evidence tiers

| Tier | Source | Allowed use |
|---|---|---|
| A | Thailand manufacturer or official Thailand distributor, exact model | Field verification within the documented model/region/scope |
| B | Authorized retailer, exact model | Documented price, availability and explicitly sourced specs; cannot replace missing official identity |
| C | User report, comparison site or secondary source | Discovery/enrichment and review priority only |

Every field receipt records source, tier, locator/page/table/row/column, observation date, raw claim, verified value and status. Unknown remains null/unknown. Wi-Fi checkmarks do not establish built-in versus optional; filter marks do not establish exact filtration capability or medical benefit. Listing on an official site does not prove current stock. Hidden commerce templates do not establish a live price or lifecycle.

Stages: discovered → ingested → field_verified → record_verified → recommendation_ready. Stages describe evidence and deliberate review, never an automatic import side effect. Runtime promotion is a separate reviewed change. Legacy inherited evidence remains labelled inherited, not freshly audited.

## Identity and conflicts

Normalize case/spacing and documented aliases only. Mitsubishi Electric and Mitsubishi Heavy Duty remain distinct. Preserve indoor/outdoor pair, electrical suffixes and color variants. Explicit CS/CU shorthand can be expanded; similar series names never establish an exact-model match. Bundles and enumerated colors require unit-level model review. Preserve conflicting source claims, mark pending_review and emit a stable review event; never average or silently overwrite values. A disputed critical field blocks promotion.

A safe new candidate requires exact non-bundle identity; current lifecycle; fresh Tier A value-matched receipts for model, install type, nominal BTU, phase, voltage, frequency and refrigerant; no unresolved conflicts; a recorded explicit reviewer and user-authorized release scope. Gate freshness is 30 days and future dates fail. Inverter ranges, noise mode, efficiency units, named air-quality features, warranty scopes and image rights remain unknown until evidenced. A clean placeholder is allowed.

## Prices and lifecycle

Preserve every observation in price_history. Scope is unit_only / includes_standard_installation / includes_pipe / unclear. Status is live / historical / out_of_stock / no_price / stale. PDF amounts are historical snapshot observations, with reported_at rather than a fabricated price_checked_at. A report-wide statement that most prices include installation does not certify each row's scope. Never pool unlike scopes. Budget uses only fresh verified unit-only samples; sparse sample wording is “ในตัวเลือกที่เราตรวจสอบราคาแล้ว…”.

Historical, discontinued or unclear candidates cannot be newly promoted. Absence from an incomplete discovery is not proof of discontinuation. A possible-discontinued report note creates review, never automatic removal.

## Operations

Use the existing source_registry, catalog_review_queue, discovery snapshots and catalog_watcher. No duplicate live pipeline, no automatic promotion and no enabled scraper without access-policy review. Weekly discovery, monthly official spec review and separate price refresh. PDF is a seed snapshot, not a freshness endpoint. Official denominators remain null until their exact scope is audited.

Reproduce extraction with `python scripts/extract_aircon_report.py --pdf /path/to/report.pdf` (pdfplumber dependency), then `python scripts/catalog_ingestion.py`. Extraction checks 30 pages, retains all text/tables and continuation cells, and emits raw/normalized/provenance artifacts. Pending findings refresh idempotently; resolved reviewer decisions remain intact. Raw PDF hash is retained; uploaded original is not republished.
