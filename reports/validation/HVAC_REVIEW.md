# HVAC expert review packet — review pending

39 public synthetic scenarios are in HVAC_SCENARIOS.json. Each includes exact synthetic inputs, expected assertion, engine output, capacity interval per zone, reasons/tradeoffs and survey flags. These are engine regression expectations, not expert-approved HVAC answers. Reproduce: `node tests/test_beta_scenarios.cjs --report`. Existing 62 configuration tests cover additional capacity boundaries, electrical voltage, asymmetric split, missing evidence and alternatives.

For each case, record reviewer/date, acceptable / needs correction / unsafe, required changes, mandatory survey criterion and supporting evidence. No reviewer or approval is invented.

Questions:
- Is any setup/capacity direction dangerous or materially wrong?
- Is estimated sizing direction reasonable for Thailand and the stated assumptions?
- When is survey mandatory rather than merely recommended?
- Which configurations must never be recommended without professional survey?
- Is a per-zone estimate from total load adequate for shortlist only, especially partial use or unequal shares?
- Are electrical/ceiling feasibility and unknown-data warnings sufficient?
- Does the no-ceiling / hidden-system fallback avoid implying a purchasable installation?

Limitations: no measured geometry/airflow, actual zone thermal simulation, pipe runs, kitchen heat quantification, circuit design, installed-total pricing or verified health/performance outcomes. Prices absent/unclear stay unknown. Unknown electrical is conditional. Advanced ducted/multi-split/VRF candidates do not claim product matches or prices.

Release decision after review: pending. Do not label automated pass as domain approval.
