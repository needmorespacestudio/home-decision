# Engineering validation protocol — HVAC expert review pending

**State:** Internal automated consistency checks only. **NOT** a calibrated or certified cooling-load model. The test fixture file is `data/engineering_validation_cases.json`; CI entry is `tests/test_engineering_cases.cjs`.

## Principles
- Owner enters **one total conditioned floor area**, never automatically sum whole-area and zone areas.
- When geometry is unknown, unit count, location, air throw, and per-zone BTU remain **provisional**.
- Never use model count/catalog coverage as evidence of optimal indoor-unit type. Unverified cassette compatibility is unresolved, not rejected on comfort merit.
- Production legacy load retains prior coefficients; shadow component model remains shadow.
- A regression PASS means **code obeys invariants**, not that actual kW/BTU sizing is correct.

## Case review form (complete independently for each case)
| Field | Reviewer input |
|---|---|
| Case ID and date | Pending |
| Reviewer qualifications / sign-off | Pending |
| Floor plan and dimensioned zone boundaries | Pending |
| Total conditioned area, ceiling volume, doors/stairs | Pending |
| Exposed envelope, roof build-up/insulation, glazing orientation and measured m² | Pending |
| Outdoor design condition, indoor setpoint, infiltration/ventilation assumptions | Pending |
| Occupancy, equipment, lighting and active cooking load | Pending |
| Independent sensible/latent/total load in BTU/h, calculation standard and software | Pending |
| Uncertainty / peak vs partial-load condition | Pending |
| Feasibility: 1 wall, 2 wall, 1 cassette, 2 cassette, mixed; airflow and supply/return paths | Pending |
| Electrical phase, unit-specific voltage, circuit and breaker verification | Pending |
| Reviewer disposition and discrepancy explanation | Pending |

## Acceptance gates (must all pass before numerical promotion)
1. Provide independent calculations with source assumptions for each case, not reference the current algorithm as ground truth.
2. Include **real measured/design review** for small closed room, compact living, 50 m² connected Living/Dining/Pantry, high glass/afternoon solar, large/tall zone.
3. Document discrepancies between legacy, component shadow and expert reference for **peak load**, partial-load behavior and zoning. Investigate systematic bias; do not tune only the 50 m² example.
4. Determine viable concepts from floor plan, airflow/throw and installation constraints **before** filtering product availability. A catalog gap yields `catalog_gap`, not 'bad type'.
5. Verify that estimated zone capacity is not fabricated from 50:50 unless explicitly labelled a scenario. Require independently known zone boundaries to call it a zone load.
6. Preserve homeowner simplicity: default answer first, ask for plan/photos only when needed, no new obligatory technical survey form.
7. Run CI, expert sign-off, feature-flag/shadow comparison, then staged release; audit actual outcomes and rollback criteria.

## First open case — user's 50 m²
Only total floor area, 2.7 m ceiling, afternoon sun, medium glazing, 2 people, afternoon–evening use, single-phase supply, and earlier decision output **37,730–53,183 BTU/h / 2 × 27k** are user-supplied. Roof construction, precise openings and full layout remain unconfirmed. Prior user explicitly confirmed the **50 m² covers all Living+Dining+Pantry**, so don't ask whether additional conditioned area is included again. The number `27k` is a rounded provisional half-load target, not independent zone sizing. The `50m²` code fixture sets hypothetical missing fields **solely to exercise regression; never state these as user observations**.

## Evidence policy
Record expert reviewer, calculation date, unit types and documented confidence in a separate reviewed artifact before asserting real-world accuracy. As of this protocol no expert has approved any fixture.
