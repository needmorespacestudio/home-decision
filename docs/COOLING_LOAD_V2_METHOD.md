# Cooling Load Engine V2 — Engineering Foundation

Status: **shadow / validation gate**  
Date: 2026-10-07

## Why this exists

Home Decision must stay easy enough for ordinary users while avoiding false precision. The production estimator historically used a Thailand-oriented area baseline with modifiers. V2 adds a separate component-based model so we can validate and calibrate the sizing layer before it becomes the production source of truth.

The V2 shadow model does **not** claim Manual J or ASHRAE compliance. It is an engineering-informed estimator used to expose missing inputs, separate sensible and latent load, compare two independent methods, and trigger a site-survey gate when confidence is low.

## Standards-informed principles

- Residential cooling load should consider opaque surfaces, fenestration, infiltration/ventilation, occupancy, and latent load separately.
- Room/zone load and equipment selection are different decisions.
- Manufacturer capacity and electrical compatibility remain hard gates after the load estimate.
- Peak inverter capacity is not treated as evidence of sustained room coverage.
- Complex/open/high-glazing/high-ceiling spaces need site review rather than false precision.

Primary background references:
- ASHRAE Handbook Fundamentals, Ch. 17 Residential Cooling and Heating Load Calculations.
- ASHRAE Handbook Fundamentals, Ch. 16 Ventilation and Infiltration.
- ACCA Manual J overview (residential load calculation) and Manual S overview (equipment selection).

## User experience contract

Quick Flow remains short. Extra questions appear only when they materially reduce sizing uncertainty:

- strong afternoon/all-day sun, area >=25 m², or Living+Dining → ask approximate glazing
- strong afternoon/all-day sun or area >=25 m² → ask top-floor/roof exposure
- area >=30 m² or Living+Dining → ask open/connected condition

The user may always choose “ไม่แน่ใจ”. Unknowns widen the range and reduce confidence instead of silently becoming facts.

## V2 component model

The shadow model separately estimates:

1. opaque wall transmission + solar allowance
2. roof/ceiling transmission + solar allowance
3. glazing transmission + solar gain
4. infiltration sensible load
5. infiltration latent/moisture load
6. occupants
7. internal lighting/equipment allowance

Output includes:

- sensible BTU/h
- latent BTU/h
- total low/mid/high range
- component breakdown
- unresolved inputs
- risk flags
- confidence: high / medium / low
- cross-check against the current production estimator

## Promotion rule

Until HVAC expert review and calibration pass, **V2 must not replace the production sizing estimator**.

Production behavior in this sprint:

- current estimator remains primary
- medium/low V2 confidence widens the production range conservatively
- low confidence triggers site-check language
- large disagreement between current estimator and V2 triggers site-check language
- result page exposes the V2 calculation only under progressive disclosure

Promotion from shadow → primary requires:

1. expert review of representative Thai residential cases
2. calibration against known room-by-room load calculations or accepted professional software
3. documented error bounds and known failure modes
4. regression tests for bedrooms, living rooms, open plan, top floor, glazing, occupancy and zoning
5. explicit Product Constitution decision

## Known limitations before expert calibration

The present V2 coefficients use a generic hot-humid residential archetype. They are **not** location-specific design weather and do not know exact wall construction, insulation, glass SHGC/U-value, external wall dimensions, measured infiltration, appliance heat, or kitchen process load unless supplied.

Therefore:
- no “100% accurate” claim
- no exact-engineering claim
- no automatic promotion for double-volume, connected rooms, heavy glazing + afternoon sun, large open plan, or uncertain kitchen heat
- no room-by-room 2-zone allocation based on area alone once V2 becomes primary; each zone will need its own load inputs or a professional survey

## Next calibration gate

Create an HVAC review dataset containing at least:
- 10–20 m² bedrooms
- 25–35 m² living rooms
- 45–70 m² open plan
- west sun + high glazing
- top floor
- high ceiling
- 1 vs 2 zones
- wall vs cassette
- known 1-phase/3-phase cases

For each case compare:
- current estimator
- V2 shadow estimate
- professional/accepted load result
- recommended nominal capacity class
- whether site survey should be mandatory
