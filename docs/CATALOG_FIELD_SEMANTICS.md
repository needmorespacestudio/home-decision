# Catalog field semantics — Sprint 1

The runtime remains inline `PRODUCTS`, with `data/aircon_catalog.json` an exact mirror. No asynchronous data dependency was added to the PWA.

- One record is one exact indoor/outdoor pair or explicitly named manufacturer electrical variant. `model` is the original displayed identity; `indoor_model`/`outdoor_model` are null unless separately documented. Family names never imply capabilities.
- `nominal_btu`, `min_btu`, `max_btu` are BTU/h. Original kW and the documented conversion are retained where applicable. A rounded manufacturer nominal class can differ from converted range endpoints by less than 1%; this is disclosed, not silently rewritten.
- `seer` is BTU/Wh; `eer` and `cspf` are separate metrics. Ambiguous “EER or SEER” source labels stay in `metric_raw` and grant no energy preference points.
- `phase` is the string `1` or `3`; voltage retains its source string, frequency is Hz. An unverified electrical value never excludes a candidate. Missing electrical data requires installer confirmation. Toshiba's published `200V/50Hz` is retained as raw text, not guessed to be 220V.
- `noise_low_dba` is a verified lowest listed indoor level. `noise` identifies location, mode and metric when published; unspecified sound metrics are not relabelled as sound pressure. Toshiba's unlabeled location/mode levels are raw only and do not grant quiet points. Different test conditions remain a comparison limitation.
- `wifi_status`: `built_in`, `optional_module`, `unavailable`, `unknown`. Optional connectivity is disclosed separately from built-in capability.
- Structured air capabilities identify filters/ions/brand technology exactly. Ionizer or Plasmacluster alone does not imply a PM2.5 filter or health benefit. Empty feature lists mean unknown, not confirmed absent.
- A verified warranty summary does not measure service quality. Conditions, registration and exclusions require seller confirmation.
- `price_thb` is a dated exact-model sample only, with `price_url`, `price_checked_at`, `price_source_type`. Unknown is null, never zero. No market price is inferred. The five baseline price observations are inherited, not freshly revalidated in this sprint.
- `lifecycle`: `current` (exact official listing reviewed), `unclear` (identity evidence exists, exact current availability not established), `historical` or `discontinued` (excluded). Current listing is not a stock guarantee.
- `verified_fields` gates runtime behavior. `evidence` records field source, date, and confidence scope, distinguishing inherited assertions from fresh reviews. Numeric `data_confidence` is not calibrated and does not break ranking ties; new records use null. Stable product ID breaks exact ties without counting brand inventory.
- `recommendation_ready` in this local candidate release means minimum checks passed. The independent human release gate in the Master Spec remains required before publication. Saved discovery snapshots always set readiness false and never auto-promote.
- All 11 brand discoveries are partial. `discovered_count`, `denominator_scope` and `coverage_pct` remain null; ingested counts are not a market denominator.

`checked_at` dates on inherited records remain inherited assertions, explicitly marked in evidence. Historical/discontinued exclusion, verified phase/range guards and missing-field disclosure implement the existing Master Spec. No UX flow was added or removed.
