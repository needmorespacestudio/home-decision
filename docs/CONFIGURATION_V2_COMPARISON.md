# Configuration Engine V2 — Comparison & Validation (shadow only)

## Reproducible check
Run `node scripts/compare-configuration-v2.cjs` from repository root. Use `--json` to generate machine-readable comparisons. GitHub CI also runs `tests/test_configuration_v2_comparison.cjs`.

The comparison replays five fixtures in `data/engineering_validation_cases.json` against **actual production configuration logic** (from `index.html`) and the catalog-neutral **Configuration V2 shadow**. Its results are *engineering follow-up queues*, **not evidence that either method predicts actual cooling needs correctly**. Fixture unknowns are not observations of the user's home.

## What is compared
- Production recommended setup, unit count, fit/site status and estimated overall load range.
- Whether that same installation concept is eligible, excluded or survey-required in V2.
- Alternate V2 concept statuses (wall x1/x2, cassette x1/x2, mixed) separate from product-catalog supply.
- Structured discrepancy reasons: unverified 50:50 zone split; missing ceiling / layout; excluded concept and pending expert confirmation.
- **No promoted winner** in V2; zone load remains unknown absent separately measured zonal geometry.

## Example reference case
Living + Dining + Pantry **50 m² total**; user previously exported **37,730–53,183 BTU/h** and **2 x 27,000 BTU** from one survey. This old export is *reference evidence*, not a snapshot necessarily reproduced from incomplete fixture inputs. We do not fabricate unknown roof, zone geometry or wall exposure.

## Gates before public V2 replacement
1. Independently verify envelope, glazing, opening boundary, zoning and placement with a qualified HVAC reviewer.
2. Compare expert-calculated sensible, latent and total cooling loads against both estimators across representative Thai residential cases.
3. Site-screen the viable equipment concepts before SKU matching, including airflow throw, drain/floorplan, ceiling and verified electrical loads.
4. If a concept is still unknown, report *survey required* rather than unsuitable. Do not manufacture BTU per zone.
5. Preserve simple-room defaults and verify user-facing Thai clarity with real homeowner testing.
6. Only then consider an explicit production rollout behind a rollback-capable gate; CI green alone is insufficient.

## Release scope
This version only adds developer comparison and CI checks. It does **not** replace the production engine, adjust sizing coefficients, change result UI, automatically collect private answers, or assert engineering validation.
