# Cooling Configuration & Zoning Sprint — QA

Baseline inspected before implementation: `36d0922` on main, clean checkout. Both required docs read. Runtime/mirror remain 51 records / 10 brands, wall 43 / cassette 8. Brand counts match the requested baseline. No catalog facts, pricing dates, image sources or readiness flags changed.

## Architecture and behavior

Maintainable synchronous source `scripts/cooling-layer.js` is embedded in the existing runtime with a checked mirror, retaining offline/PWA behavior. Existing cooling-load, evidence, image/link, quote/manual fallback and priority functions remain. Configurations use ordered feasibility/coverage/electrical/distribution/needs/priority/value criteria and structured reasons; product matching is per zone. Nominal capacity must cover the upper preliminary load for exact status. Known incompatible phase/voltage is excluded; unknown facts keep a site-check status. Shortlists diversify brands without SKU-count scores.

One primary setup, at most two alternatives; products are revealed by CTA. Advanced considerations do not invent matched ducted/multi-split/VRF products. Quote requests and Brief v3 include selected setup and all zone shortlists. A preliminary equal budget allocation per zone is disclosed. Equipment estimate sums verified price samples only if every zone has one; installation and numerical savings are never invented.

## Adaptive questions

- Usage and shape: ≥40m², non-bedroom ≥30m², Living+Dining, or known open plan.
- Independent control: only when partial use or long/connected topology makes it relevant.
- Ceiling availability: potential ceiling installs (≥30m² or explicit cassette/hidden), never for wall-only preferences.
- Outdoor space: only when user selects specific installation constraints.
- Optional advanced load shares: 50:50, 60:40, 40:60; no new mandatory engineering form.

## Supported types

One wall; two independent wall units; one 4-way cassette; two cassette units for multi-zone ceiling use; mixed wall/cassette only with zoning and a feasible ceiling. Ducted is an advanced survey-only consideration. Multi-split when a single outdoor position conflicts with zoning; VRF/VRV for large/connected cases are future considerations only.

## Validation

- Configuration: 62 representative scenarios passed, including small rooms, 1 vs 2, phase, voltage, ceiling exclusion, unknown electrical, gaps, noise/air evidence, prices, asymmetric loads, peak capacity, brand neutrality and brief/event contracts.
- Existing recommendation/regression suite: 43 passed.
- PWA suite: 7 passed; cache version advanced to v5, navigation stays network-first with offline fallback.
- Catalog tests: 10 passed; runtime/mirror 51, zero mutations/events from offline watcher.
- Browser: 60 local checks passed. Quick small bedroom and zoned living, Detailed compact living, 390px and centered 1440px desktop; setup → products → detail/source links → manual Quote → Brief → compare/select; budgets, special needs, image fallback and advanced editing additionally exercised. Source-verification mode compares normalized full live HTML against the tested checkout. Browser check counts and screenshots are saved separately per actual run.
- Live PWA: 6 focused checks passed after correcting the QA fixture to seed the obsolete cache before normal registration. Controller is `/sw.js`, sole cache is `home-decision-v5-cooling-zoning`, shell is cached, offline navigation renders home and starts Quick Flow. The earlier query-URL update fixture raced with the app's normal registration; its failure was resolved in the test without changing production worker behavior.
- Local deployment is a static server; this feature makes no new server/database requests. Existing optional backend/demand behavior remains unchanged.

See `COOLING_CONFIGURATION_EXAMPLES.json` for 10 reproducible scenarios, per-zone target/candidates, alternatives, sample equipment costs and survey flags. Targets are preliminary upper-load estimates, not nominal SKU classes or final engineering sizing.

## Gaps and limitations

Hisense exact models; cassette 24K/30K; fresh complete price samples; noise/filtration/voltage evidence; concealed/multi-split/VRF catalog. At high per-zone load, Catalog Gap remains explicit even when a near match exists. Cassette ceiling fit always needs site confirmation. Zone loads use total estimate times user-selected shares, with no thermal simulation, measured airflow reach, floor plan, kitchen heat quantification, pipe run or electrical circuit design. Two units need installation-space and placement checks. No energy-saving percentage, installed-cost total, fresh-price implication or whole-market ranking claim.

## Release gate

User explicitly requested commit to main and Production deployment in this sprint. Local tests preceded publishing. Application commit `a126f526f4a77812d6c87ec1b2ff81676decffc5` was committed on a preview branch; its Vercel success and GitHub Actions success were verified, then the same commit fast-forwarded to main. Production Vercel check succeeded at `https://vercel.com/panupongtr4-1388/home-decision/C3jaRKSwg2uy2gWbb2x2ef8XgLDy`; live HTML matched the checkout and live flow assertions passed before the PWA fixture correction described above. Final full live check count is in the delivery report, after the test-only follow-up release.

Vercel project identity: `prj_eBJq4YuuGiqSueFCmJAN06jhvY8F` (`home-decision`) under `team_aVJ9CiefWYcwQoaqgB44MCfJ`. Connected deployment API returns 403 for that scope; no Vercel CLI is installed. Preview dashboard/browser access needs login, so direct preview UI validation and API-confirmed READY remain unavailable. Local browser checks, GitHub Vercel/CI success, exact live-source verification and live Production browser checks are distinct evidence; do not describe the inaccessible API status as read successfully.

Ready for privacy-reviewed analytics wiring and a small supervised Private Beta after release checks; not a general HVAC design/public-market-completeness gate. Vendor choice, event deduplication, retention/consent, feedback collection and unresolved survey monitoring remain next steps.
