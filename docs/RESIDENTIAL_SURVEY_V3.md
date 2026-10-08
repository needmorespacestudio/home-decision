# Residential Survey V3 — Aircon Decision

Status: implementation candidate / private-beta validation
Scope: **residential homes only**

## Product goal

Ask ordinary homeowners the smallest set of questions that materially changes a safe recommendation. The user should describe what they can see and how they use the room; the backend translates that into engineering inputs, confidence, configuration and product filters.

The two user-supplied survey-advisory PDFs are useful design input, but their numeric engineering thresholds are AI-generated and explicitly unvalidated. This version therefore adopts the information architecture, branching logic, uncertainty handling and product-ranking concepts where they fit the Product Constitution, while avoiding treating those PDFs as ground truth for Cooling Load coefficients.

## Two-stage decision funnel

### Stage 1 — Engineering suitability

Determines:
- residential scope
- preliminary cooling-load range
- confidence
- one vs multiple units / zoning
- Wall vs Cassette feasibility
- electrical/site-check requirements

Stage 1 is not influenced by sponsor, popularity, preferred brand or lifestyle features.

### Stage 2 — Lifestyle and value

Runs only after the technical envelope is known:
- Special Needs
- Budget
- ranked Top 3 priorities
- product ranking among technically eligible models

## Quick Flow core questions

1. Room use: Bedroom / Living / Living + Dining or residential open plan / Other home room
2. Approximate width × length, with area-only fallback
3. Whether the cooled boundary can be closed
4. Afternoon / direct solar exposure
5. Amount of glazing on the exposed side
6. What is above the ceiling: room / roof / concrete deck / unknown
7. Ceiling height category
8. Normal occupancy + main time of use

The UI remains one decision per screen except occupancy + time, intentionally combined because both are simple one-tap lifestyle observations and reduce total friction.

## Adaptive questions

Displayed only when they reduce uncertainty:
- roof/deck → insulation; if roof and insulation absent/unknown → roof type
- strong sun + high glazing → external/internal shading
- open boundary → approximate connected area
- Living + Dining → kitchen intensity
- larger/elongated space without dimensions-based shape certainty → room shape
- larger loads → zone usage / ceiling feasibility / electrical phase

The Quick Flow caps risk follow-ups at four. If more than four are simultaneously justified, the room is treated as complex and a site-survey gate is preferred over a long questionnaire.

## Residential hard gates

A hard gate stops purchase-ready model cards. The system may still show a preliminary range and Decision Brief.

Current conservative product gates:
- unsupported room category in Aircon v1
- Double volume / visibly open to second floor
- open to stair/high void or frequently open exterior
- active heavy kitchen connected to the conditioned area
- large connected open plan above roughly 60 m²
- large room with strong afternoon sun + high glazing + no shading
- several unresolved core variables
- adaptive complexity beyond the Quick Flow cap
- large-load case where electrical supply is still unknown

These are **product-safety gates**, not claims of universal engineering thresholds. They must be recalibrated as real field outcomes accumulate.

## Soft gates / confidence

Soft gates keep results visible but cap confidence and require installer verification:
- top floor with unknown insulation
- ceiling roughly 3–4 m
- long / L-shaped / multi-corner room
- high-capacity case with unknown electrical supply
- multiple unknown primary heat-gain inputs

Unknown answers do not become verified facts. They widen uncertainty and lower confidence.

## Cooling Load relationship

Cooling Load V2 remains engineering-informed and uncertainty-aware. Residential Survey V3 improves the inputs feeding it but does not promote unvalidated AI-review coefficients into production truth.

Do not:
- average the two AI review packs
- use their load estimates as ground truth
- claim Manual J / ASHRAE compliance
- use a universal oversize percentage for every inverter model

Equipment selection still separates room load from manufacturer capacity/modulation and electrical compatibility.

## Configuration

Default is system-guided, not “choose your AC type.”

One vs multiple units considers:
- total load
- room geometry / throw distance
- open boundaries
- partial-zone use
- asymmetric heat gain
- ceiling feasibility
- electrical and outdoor-unit constraints

Zone loads must move toward zone-specific inputs. Do not rely on 50:50 or 60:40 area splits as a final engineering answer.

Wall remains the normal residential default. Cassette is a candidate only when geometry and ceiling access make it plausible, with explicit checks for above-ceiling space, drainage, service access and electrical supply.

## Best Choice

**Best Choice สำหรับคุณ** is the primary recommendation after:
1. technical compatibility
2. verified capacity / install type / electrical constraints
3. Special Needs evidence
4. ranked Top 3 priorities
5. budget/value

Popularity **never** promotes an incompatible model and is not part of the hard technical rank.

## Popular Choice / Selected / Purchased

Three separate concepts:

- Best Choice: system recommendation
- Popular Choice: users with a comparable broad cohort selected the model
- Purchased Choice: users later confirmed they actually installed/bought it

Current UI rules:
- sample < 30: show “ข้อมูลผู้ใช้ยังไม่มากพอ”; no percentage
- sample 30–99: qualitative Popular Choice label only
- sample >= 100: percentage + denominator + time window may be shown
- never infer purchase from product click, official-link click or quote action

Anonymous choice events:
- decision_selected
- decision_purchased

Event cohort uses broad, non-identifying buckets (room type + BTU band + setup type), not exact dimensions, address, contact or quote text.

There is currently no cross-user persistent store. Therefore production must not fabricate percentages. The social-proof data object remains empty until a real aggregation pipeline exists.

## Reachability and neutrality

Every recommendation-ready model that is not strictly dominated should remain discoverable in at least one eligible decision path or in “ดูตัวเลือกเพิ่มเติม.” Do not add survey questions merely to give a SKU exposure. Commercial promotion must remain separately labeled and cannot alter Best Choice.

## Validation

Regression must cover:
- residential-only room scope
- dimensions → area derivation
- long-room detection
- open stair / exterior hard gate
- Double volume hard gate
- heavy connected kitchen hard gate
- large connected open-plan gate
- high solar glazing gate
- unknown handling
- adaptive cap
- roof/shading/open-area follow-ups
- Best Choice labeling
- Popular Choice sample thresholds
- no fake percentages
- broad privacy-safe cohort key