# Cooling Load V2 — HVAC Expert Review Packet

Status: ready for external review  
Engine state: shadow / not promoted to production sizing

## Reviewer goal

Please review whether Home Decision's sizing direction is reasonable and identify cases where the service must refuse to give a purchase-ready answer without a site survey.

For each case compare:
1. current production estimator range
2. Cooling Load V2 shadow range and component breakdown
3. your professional load result / accepted HVAC software result
4. recommended nominal capacity class
5. whether one or multiple units are appropriate
6. whether site survey is mandatory

## Core questions

- Is any assumption unsafe or directionally wrong for Thai residential use?
- Which inputs materially affect load enough that Quick Flow must ask them?
- Which inputs can safely remain defaults/unknown with a wider range?
- Is the latent/moisture treatment directionally reasonable for hot-humid Thailand?
- At what disagreement between methods should Home Decision stop and force a site survey?
- Which room types should never receive a purchase-ready recommendation from a simple online survey?
- Which oversizing/undersizing limits should be used before equipment selection?
- For 2-zone recommendations, what minimum zone-level data is required?

## Representative cases

| # | Case | Inputs to review | Expected gate |
|---|---|---|---|
| 1 | Small bedroom | 10 m², normal ceiling, low glazing, shaded, 2 people, night | online answer likely possible |
| 2 | Bedroom | 12 m², morning sun, medium glazing, 2 people | online answer likely possible |
| 3 | Bedroom west sun | 14 m², afternoon sun, medium glazing, 2 people | check glazing effect |
| 4 | Top-floor bedroom | 15 m², top floor, afternoon sun, medium glazing | check roof effect |
| 5 | High-glazing bedroom | 16 m², west sun, high glazing | likely medium confidence |
| 6 | Bedroom high ceiling | 18 m², 3.4 m ceiling | check ceiling/volume effect |
| 7 | Living room | 25 m², closed, normal ceiling, medium glazing | online answer likely possible |
| 8 | Living room west sun | 30 m², afternoon sun, high glazing | strong solar review |
| 9 | Living room top floor | 32 m², roof exposure, medium glazing | roof + solar review |
| 10 | Living room open | 35 m², partial/open connection | infiltration/open-boundary review |
| 11 | Living + Dining | 40 m², open plan, 4 people | zoning threshold review |
| 12 | Living + Dining | 45 m², partial-zone use | 1 vs 2 units |
| 13 | Long room | 50 m², long/narrow | airflow + 2-zone review |
| 14 | West-glass open plan | 50 m², high glazing, afternoon sun | mandatory survey candidate |
| 15 | Open plan | 55 m², normal ceiling, 4 people | 1 cassette vs 2 wall |
| 16 | Open plan top floor | 60 m², roof exposure | survey candidate |
| 17 | Large connected area | 65 m², connected rooms | multi-zone/site survey |
| 18 | Large west open plan | 70 m², high glazing | mandatory survey |
| 19 | High ceiling living | 60 m², 4.0 m ceiling | mandatory survey |
| 20 | Double volume | 45 m², >4.5 m ceiling | mandatory survey |
| 21 | Living + pantry light use | 45 m², no heavy cooking | verify internal-gain assumption |
| 22 | Living + active kitchen | 45 m², cooking heat source | should force professional survey |
| 23 | Office | 25 m², 4 people, equipment | internal-gain review |
| 24 | Home office | 15 m², 2 people, multiple computers | internal-gain review |
| 25 | Cassette candidate | 45 m², ceiling available, compact layout | type/configuration review |
| 26 | Cassette high glazing | 50 m², west glass | load + distribution review |
| 27 | Two-zone 60:40 | 60 m² living/dining | zone-load allocation must be reviewed |
| 28 | Two-zone 50:50 | 50 m² but asymmetric glazing | demonstrate why area split alone is insufficient |
| 29 | Unknown electrical | 48k-class cassette candidate | purchase-ready answer must be blocked |
| 30 | Conflicting estimators | any room where legacy vs V2 differs >35% | site-check + expert review required |

## Promotion criteria

Cooling Load V2 may become the primary sizing engine only after:
- no critical safety failures in expert review
- coefficients/calibration revised from review evidence
- error bounds documented by room type
- zone-specific load method defined for multi-unit recommendations
- at least 30 representative tests pass after calibration
- Product Constitution explicitly promotes V2
- result wording continues to show a range/confidence instead of false precision

## What Home Decision should never claim

- “แม่น 100%”
- “เทียบเท่า Manual J” unless a licensed/validated implementation actually meets that standard
- “ASHRAE compliant” based only on using similar component categories
- exact installed performance without site conditions and manufacturer performance data
