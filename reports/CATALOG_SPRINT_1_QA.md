# Catalog Expansion Sprint 1 — QA / release candidate

Date: 2026-10-07. Release status: deployed_live_verified_ready_api_unverified. Human approval recorded in canonical review queue.

## Counts

Before: 21 records / 4 brands. After: 51 minimum-evidence candidates / 10 brands.

Types: {'wall': 43, 'cassette': 8}. Lifecycle: {'unclear': 23, 'current': 28}. Confirmed discontinued/historical: 0; unclear is not proof of current stock.

| Brand | Before | After |
|---|---:|---:|
| Panasonic | 4 | 6 |
| Mitsubishi Electric | 8 | 8 |
| Samsung | 5 | 5 |
| LG | 4 | 4 |
| Daikin | 0 | 4 |
| Mitsubishi Heavy Duty | 0 | 5 |
| Carrier | 0 | 5 |
| Toshiba | 0 | 5 |
| Haier | 0 | 4 |
| Sharp | 0 | 5 |
| Hisense | 0 | 0 |

## Field completeness — verified fields within this catalog, not market coverage

| Field | Before count / % | After count / % |
|---|---:|---:|
| model | 21 / 100.0% | 51 / 100.0% |
| type | 21 / 100.0% | 51 / 100.0% |
| nominal_btu | 21 / 100.0% | 51 / 100.0% |
| min_btu | 14 / 66.7% | 33 / 64.7% |
| max_btu | 14 / 66.7% | 33 / 64.7% |
| seer | 13 / 61.9% | 36 / 70.6% |
| phase | 12 / 57.1% | 30 / 58.8% |
| voltage | 12 / 57.1% | 35 / 68.6% |
| frequency_hz | 0 / 0.0% | 36 / 70.6% |
| noise_low_dba | 3 / 14.3% | 26 / 51.0% |
| wifi | 6 / 28.6% | 20 / 39.2% |
| warranty_summary | 9 / 42.9% | 20 / 39.2% |
| refrigerant | 15 / 71.4% | 45 / 88.2% |
| price | 5 / 23.8% | 5 / 9.8% |
| air_quality | 1 / 4.8% | 15 / 29.4% |

## BTU coverage

wall: [9000, 9080, 9200, 9212, 9633, 12000, 12200, 12283, 12297, 12300, 12406, 15000, 15640, 17700, 17742, 18000, 18097, 18100, 18244, 20400, 20500, 21154, 21500, 24000, 24215, 24322, 28005, 36137]

cassette: [36167, 36200, 42000, 48000, 48109]

## Sources / lifecycle / missing evidence

Evidence basis: {'inherited_baseline': 13, 'mixed_manual_official_review': 8, 'fresh_manual_official_review': 30}. All identity/spec sources are official Thailand manufacturer or official Thai brand distributor. No authorized-retailer price was added. Five original prices remain inherited official-source samples; fresh price coverage is zero.

Carrier exact suffix uses 2023 brochure plus current family page; Sharp uses 2025 brochure. These records retain unclear lifecycle and explicit current-availability disclosure. The remaining inherited Panasonic/Samsung/LG records are also unclear pending renewed exact-model review. Mitsubishi Electric eight exact pages and 2026 catalogue links were independently reviewed.

Toshiba ambiguous electrical and energy labels were quarantined as raw evidence. Toshiba noise without location/mode is excluded from quiet ranking. Unconfirmed fields remain null. New images use placeholders with source links.

No discontinued recommendation is allowed by runtime tests. No stale assertions are refreshed merely because discovery ran. All denominators remain null and all snapshots are partial.

## Brand gaps

- Daikin: 9K FTKQ09 remains in older PDF/shop link but absent from current variant tabs; not promoted. New cassette exact pairs not verified.

- Mitsubishi Electric: Eight inherited exact-model official pages independently reconfirmed with 2026 catalogue links. Additional residential 24K/30K cassette models not ingested; partial enumeration only.

- Mitsubishi Heavy Duty: 5 exact Yuki 2026 indoor/outdoor pairs; cassette and full denominator not audited.

- Panasonic: Added YU28/36. NX cassette official PDF access denied; no variants promoted from snippets.

- Carrier: Exact suffix specs from official 2023 PDF; current family marketed, exact suffix lifecycle unclear.

- Samsung: 5 inherited records. Search extracts mix hidden discontinued templates with buy UI; lifecycle must be checked on rendered exact page.

- LG: 4 inherited records; new wall/cassette exact variants not audited.

- Toshiba: 5 exact pairs; 200V source and ambiguous EER/SEER withheld from normalized fields. Indoor/mode noise scope unresolved.

- Haier: 4 exact VQAC05 models; warranty, price, Wi-Fi unconfirmed.

- Sharp: 5 exact models from 2025 official PDF; current lifecycle unclear, phase not inferred.

- Hisense: Official TR page contains family/capacity classes and image specs but no verified exact Thai SKU extracted; no retailer SKU promoted.

## Validation

43 representative recommendation/regression cases, 7 PWA cases and 10 Python integrity/watcher tests pass. Exact mirror check passes. Zero duplicate exact variants. All published nominal/range/SEER units are bounded; manufacturer rounded BTU vs converted kW endpoints allow <1% rounding only. No contradictory verified 1-phase/380V record. All 9 watcher event categories are covered by tests; absent products in partial snapshots are never marked discontinued.

Browser and release checks are recorded separately in BROWSER_VALIDATION.md; automated checks do not prove a completed live deployment.

## Files changed

- index.html, sw.js
- data/aircon_catalog.json, aircon_catalog_coverage.json, source_registry.json, catalog_review_queue.json
- data/discovery/* (baseline and 11 partial brand snapshots)
- scripts/catalog_watcher.py, scripts/catalog_qa.py
- tests/test_catalog_watcher.py, test_catalog_integrity.py, test_recommendation.cjs
- docs/CATALOG_FIELD_SEMANTICS.md, reports QA and browser validation artifacts

## Before Private Beta

Human approval and live release checks are complete (direct READY API remains inaccessible); renew five baseline price samples and remaining inherited lifecycle evidence; add official residential cassette 24K/30K variants, Hisense exact-model evidence, consistent noise test conditions, actual warranty terms, HVAC expert review and launch analytics. Keep adapters disabled until source policy and parser fixtures are audited.

Newly discovered products do not become recommendations through the watcher.
