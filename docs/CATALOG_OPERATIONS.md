# Catalog operations

Read [Product Constitution](HOME_DECISION_MASTER_SPEC.md) first. Production stays on main at https://home-decision-eight.vercel.app.

## Current architecture

Cooling/Zoning sprint retains the 51-record runtime and exact catalog mirror. `scripts/cooling-layer.js` is the maintainable configuration source embedded synchronously in `index.html` for offline/PWA compatibility; run `node scripts/sync-cooling-layer.cjs` after changing it, and `node scripts/sync-cooling-layer.cjs --check` before release. Configuration product matching operates per zone; conservative nominal ≥ upper-load coverage may reveal gaps previously hidden by whole-room near matches. Run `node tests/test_configuration.cjs`, `node tests/test_recommendation.cjs` and `node tests/test_pwa.cjs` plus the catalog tests below. Browser regression uses `tests/test_browser.cjs` with a local Playwright module and optional BASE_URL/BROWSER_CHANNEL/QA_DIR. No catalog readiness or field evidence is changed by this layer.

`index.html` PRODUCTS remains runtime source for this compatibility phase. `data/aircon_catalog.json` is an exact structured mirror (no image/link logic removed). `scripts/catalog_export.py` is an explicit maintainer export. After a reviewed runtime catalog change, export again and review the diff; `--check-mirror` fails if they diverge. Do not hand-edit the mirror alone and assume production changed. Future migration requires a tested synchronous build/export or resilient loading strategy.

Coverage metadata is in `data/aircon_catalog_coverage.json`; official Thai sources and access policy are in `data/source_registry.json`. The checked-in health report is a dated baseline, not a live status promise. Generated reports distinguish inherited evidence from fresh verification, and unknown link health from confirmed broken links.

## Cadence and automated scope

| Cadence | Task | Current execution |
|---|---|---|
| Daily (optional) | Important-product link / price anomalies | Disabled until source-specific access policy is reviewed; link success never refreshes spec checked_at |
| Weekly | New model / variant / possible discontinued discovery | Scheduled read-only baseline report; manual discovery snapshots until adapters approved |
| Monthly | Core spec re-verification / staleness | Scheduled age-based review report; actual manufacturer spec re-verification is manual |
| Demand-driven | Unknown user model → Demand Gap + priority counter | Existing local prototype briefs/demand storage retained; centralized anonymous aggregation and model-specific counters require separate implementation |

Weekly/monthly GitHub Action produces downloadable artifacts, with no production/catalog writes, issues, secrets or auto-commits. Contents permission is read-only. No extra secrets required; GitHub Actions must be enabled in repository settings. Public artifacts must never contain uploaded quotes, contact information or tokens. Schedule runs on default branch and can be delayed by GitHub. Offline runs cannot detect new real-world models: their report explicitly says `offline_baseline_no_discovery`.

## Run locally

Requires Python 3.10+ standard library only:

```sh
python scripts/catalog_export.py
python -m unittest discover -s tests -p 'test_catalog*.py'
python scripts/catalog_watcher.py --check-mirror --output-dir reports/latest
python scripts/catalog_watcher.py --previous data/aircon_catalog.json --current path/to/discovered.json --output-dir reports/review
```

Discovery snapshot format: `{"products": [...], "complete_brands": []}`. Each product has stable `id`, `brand`, `model`, optional `family_id`, structured specs and source/evidence timestamps. Keep existing ID for a confirmed rename; do not use fuzzy guessing to merge different models. NEW_VARIANT requires shared verified family_id. Do not infer variants from a naming resemblance. `complete_brands` may be populated only after a comparable full in-scope brand discovery; document scope and evidence in the snapshot. Incomplete snapshots never generate discontinued events. `source_health: {"status":"broken", "checked_at":"YYYY-MM-DD", "http_status":404}` is an explicit observation, not an assumption from a timeout or anti-bot response.

Reports include NEW_MODEL, NEW_VARIANT, SPEC_CHANGED, PRICE_CHANGED, POSSIBLE_DISCONTINUED, SOURCE_MOVED, SOURCE_BROKEN, MODEL_RENAMED, DATA_STALE. Stable event IDs deduplicate repeated events. `data/catalog_review_queue.json` is the manually reviewed baseline; output queue merges it without resetting resolved statuses. Promote/reject/snooze manually in the baseline queue with reviewer, rationale and evidence; never let an artifact mutate runtime. Review reports use current runtime-mirror counts, not discovered candidates as recommendation-ready.

## Source adapter policy and TODO

`SnapshotAdapter` supports safe saved discovery; `ManualOfficialAdapter` is an explicit stub. No network scraper is enabled. Registry URLs for newly targeted brands are official discovery entry points located via official search results, not confirmed exhaustive catalogs. Existing brands inherit exact product sources. TODO per source: confirm robots/terms and ownership; record approval date, allowed paths, requests/day, timeout/backoff and user agent; implement a parser with saved fixtures; document regional scope, families/variants and denominator; test completeness and source moved/broken distinctions. Do not bypass login, CAPTCHA or rate limits. If access is disallowed or unclear, use official downloadable catalogs/manual review or obtain permission.

## Verification and promotion

Discovered → Ingested → Verified → Recommendation Ready. A reviewer checks exact Thai model/variant, units, installation type, BTU range and electrical compatibility; checks evidence for every claimed feature and price scope/date; records missing fields; validates engine boundaries and image/source links; approves readiness explicitly. Legacy ready records remain inherited, not recertified by this watcher. Never substitute marketing text for measured evidence or silently set recommendation_ready on discovery.

## Coverage denominator

“20 models” is a count. It is not “20/23 covered” until an official comparable denominator of 23 has been audited. Define Thailand, active period, wall/cassette scope, and whether count units are families, model numbers or BTU/phase variants. Record scope, source evidence, discovery timestamp and duplicate handling. Until then discovered_count and coverage_pct are null. Spec completeness percentages within our own catalog may be computed separately and labelled accordingly. Brand target count is not market coverage either.

## Known limits / incident handling

Production baseline before Sprint 1 was 21 records / 4 brands, wall 13 and cassette 8. Sprint 1 release is 51 records / 10 brands, wall 43 and cassette 8; human release approval was provided 2026-10-07; GitHub Vercel check and live regression passed; direct READY API state is inaccessible with the connected team credentials. See `reports/CATALOG_SPRINT_1_QA.md` and `docs/CATALOG_FIELD_SEMANTICS.md`. Evidence distinguishes fresh manual source checks from inherited assertions; not every field was re-audited. Prices remain sparse and inherited. Registry manual adapters remain disabled: no real automated discovery/link fetching, no OCR addition, no automatic recommendations. A suspected disappearance or price anomaly goes to review, not deletion. For bad data: retain evidence, mark disputed fields, review eligibility, test changed results, commit reviewed correction and verify production READY plus live regression. Update the Constitution Decision Log for product behavior changes.
