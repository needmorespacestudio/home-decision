# HVAC engineering expert review — ready-to-send packet

**Current status: awaiting an independent, qualified HVAC engineer. No engineer has reviewed or certified these cases.** This file is a handoff/checklist, not a cooling-system design.

## Scope requested
Please independently review Home Decision's Thai residential cooling-load and equipment-configuration assumptions against documented project data. Do not use Home Decision's output as a reference calculation. Evaluate room boundaries, exposed surfaces, glazing, solar, roof, occupancy, ventilation/infiltration, latent load, and installation constraints.

Review five cases from `data/engineering_validation_cases.json`: closed bedroom 16 m², compact living 30 m², connected Living/Dining/Pantry **50 m² total**, high-solar/glazing connected 50 m², and tall open hall 90 m². Most are **synthetic test fixtures**, not real room surveys.

## For each case, please return
- Reviewer name/qualification, date, documented independent method/software/standard and supporting calculation or traceable file
- Clear input provenance, measured dimensions and total conditioned area (do not add 50 m² twice)
- Wall/roof/glazing orientation, measured areas, insulation/shading; temperature and humidity design conditions
- Occupants, equipment, activity, cooking load, external air/leakage assumptions
- Independent **sensible**, **latent** and **total** peak loads (BTU/h), plus uncertainty and part-load observations
- Concept screening of **wall 1**, **wall 2**, **4-way cassette 1**, **cassette 2**, **mixed wall/cassette**, including mounting, airflow/throw, return path, drain/maintenance and electrical checks
- For each rejected or deferred option: whether physically impossible or **not enough evidence**
- Reviewer notes on legacy estimate vs component shadow and recommended tests/corrections

## User's real reference
A previous Decision Brief for 50 m² total (Living + Dining + Pantry, 2.7 m ceiling, afternoon sun, medium glazing, two occupants, afternoon–evening, single-phase supply) displayed **37,730–53,183 BTU/h** and two provisional **27,000 BTU** wall zones. This was **not** independently reviewed. No additional area should be assumed. Roof construction, exact plan, measured glass and actual air paths are unconfirmed.

## How to record evidence
Complete matching entries in `data/hvac_expert_reviews.json` with reviewer identity, date, method, publicly accessible evidence URL, sensible/latent/total reference loads, and two explicit confirmations: verified floor plan and installation concepts. The tool `node scripts/check-hvac-expert-evidence.cjs` verifies structural completeness and arithmetic only, **not the engineering correctness or the reviewer identity**. Passing it cannot automatically activate a new engine.

## Promotion rule
No V2 production promotion until independent expert review, code-calibration assessment, documented decision, full regression and a controlled release plan. This work has **not** been commissioned or externally validated by ChatGPT.
