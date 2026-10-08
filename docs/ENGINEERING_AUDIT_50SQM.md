# Engineering audit — 50 m² connected Living + Dining + Pantry (2026-10-08)

## User-supplied reference case (do not silently invent missing inputs)
- 50 m² **total including** Living, Dining and Pantry; not 50 m² per zone.
- Ceiling ~2.7 m; afternoon sun; medium glazing; 2 occupants; typically afternoon-evening; single-phase household supply.
- User-facing Decision Brief: estimated total cooling load **37,730–53,183 BTU/h**, two wall units labelled **27,000 + 27,000 BTU**, `site_check`.
- Unknown from Brief: detailed room dimensions/shape, open-to-stair status, actual connected-airflow boundaries, roof/insulation, shading, partition geometry, supply-air throw, real cassette mounting clearance, effective kitchen heat, individual zone areas and verified electrical capacity.
- User confirms **50 m² already includes all connected areas**.

## Reproducible production model audit
1. `index.html:load()` is the production legacy heuristic: baseline **650–750 BTU/(h·m²)** times independent modifiers: room (living+dining 1.03), usage (afternoon 1.06), sun (afternoon 1.10), glazing (medium 1.03), roof (no 1 / yes 1.10 / unknown 1.04), opening (closed 1 / partial 1.05 / open 1.10), and height ratio; `high` also multiplies 1.04. Exact reproduced values depend on roof and opening states absent from the exported Brief. Do not reverse-infer those answers.
2. `scripts/cooling-load-v2.js` provides a **shadow** component model, not an independently calibrated ground truth; production `load()` retains the legacy estimate and conservatively widens bounds for medium/low confidence (6% / 12%). The Brief includes a substantial crosscheck disagreement.
3. `scripts/cooling-layer.js` uses the total computed load `L` once, then splits 2-unit candidates with `s.zoneShare || 0.5` — default **50:50** — and rounds each zone target **up to the next 1,000 BTU**. The resulting 27k + 27k is a search target, **not an observed load calculation of Living and Dining independently**. This path does not double-count the total 50 m² based on zone area, but connected-area input and legacy assumptions need dedicated inspection.
4. Configuration candidates can include wall 1/2, cassette 1, cassette 2 and mixed subject to constraints. `decision_order` uses feasibility, verified catalog coverage, electrical evidence, spatial distribution, preferences and budget. Thus a SKU-rich wall catalog may outrank a physically plausible cassette configuration when manufacturer data are missing. Catalog completeness does **not** prove air-distribution superiority.

## Risk classification and non-regression contract
- **No recommendation-ready purchase prescription** for 50 m² connected open layouts with divergent thermal models and unknown zone geometry.
- Never display an unsurveyed 50:50 split as an independently validated per-zone BTU requirement. Put the overall range first, label per-zone numbers as provisional scenario only, and explain that product availability is incomplete.
- Site evaluation must cover actual included cooled area, kitchen heat, airflow path/obstacles, unit placement and throw, ceiling/service access, line-set/drain and 1-phase breaker/main service constraints.
- Preserve simple closed-room recommendations, verified product-only filtering, and no fabricated price/technical claims.
- **Engineering calibration is NOT COMPLETE:** requires qualified Thai HVAC reviewer and representative measured/design cases before replacing legacy model or changing coefficients.
- Obtain exact questionnaire state or engineering case inputs before asserting why 53,183 BTU/h arose; the Brief omitted key inputs.

## Engineering acceptance checklist (future validation, not passed)
- [ ] Independent 50 m² room and zone plan including exposed walls, glass orientation/area, opening boundaries and roof construction.
- [ ] Qualified reviewer compares legacy and shadow components, with source and variance notes.
- [ ] 1-wall, 2-wall, 1-cassette, 2-cassette and mixed concepts screened against airflow and actual installation constraints.
- [ ] Zone loads independently computed where layout permits; otherwise display unknown.
- [ ] Calibration cases include small closed bedrooms, compact living rooms, 50 m² connected and high-solar large spaces.
- [ ] Expert approval logged before any numerical production model promotion.
