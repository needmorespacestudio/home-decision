# Sprint A QA — analytics and validation launch gate

Baseline: main 5fec600 (clean checkout). Read Constitution, catalog operations and latest ingestion/zoning/configuration reports before editing. Catalog/runtime mirror and decision matching unchanged. No major category or new decision UX.

## Changes

- Vendor-free sanitized trackHD, no network/persistent event store, in-memory aggregate report; per-decision dedup and successful-action definition.
- All 21 issue-required core events, plus two feedback events; six legacy configuration events retained (overlap included).
- Optional result rating and neutral/negative reason chips; other textarea is DOM-only, never captured. Known-limits disclosure includes HVAC review pending, incomplete catalog/price evidence and honest quote extraction limit.
- KPI/privacy/backend contract; Private Beta launch gate with pending human/real-user gates and tester instructions.
- 39 additional representative public synthetic scenario fixtures and reproducible HVAC packet. No invented expert approval.
- Analytics embedded synchronously like existing cooling layer; PWA cache v8 retains navigation freshness/offline architecture.

## Automated evidence

Executed with Node 24 and Python standard library:
- 39 additional beta scenarios PASS.
- 23 analytics/privacy/funnel checks PASS.
- Existing 62 configuration + 53 recommendation + 7 PWA cases PASS.
- 56 catalog tests PASS, no catalog content or readiness changes.
- Cooling/analytics runtime mirror checks and diff whitespace checks PASS.

6 clipboard/download action checks PASS.

Total 246 automated cases. Automated QA is independent from domain review and observed user comprehension.

Browser runner initially unavailable: installed Playwright package has no browser executable; official browser download did not produce a valid archive in this environment. No passing local browser run claimed. Existing browser suite remains available and is extended for this sprint; supported cloud browser is used for actual live interaction checks after deployment. Browser screenshots/390px evidence and real-device PWA installation are separate from VM assertions.

## Release evidence

Candidate not yet published when this report was written. Exact commit, deployment checks and live-source/UI evidence are added after publication. Vercel project prj_eBJq4YuuGiqSueFCmJAN06jhvY8F under team_aVJ9CiefWYcwQoaqgB44MCfJ; team-scoped API currently 403, no installed Vercel CLI. Do not claim observed READY until supported evidence exists.

## Remaining gates

Unattended measurement needs separately selected/privacy-reviewed backend, retention/consent and aggregation (current summary disappears on reload). HVAC review pending; 20–50 testers not recruited; real-user two-minute comprehension/quote task study pending. Catalog common-capacity/price/field coverage limits unchanged. Other free text is not remotely collected, and no tester invitations were sent.

## Live release verification

Application 81175191e38fcda9e3dda98e700f3ed320b3666d was deployed to main. Public alias https://home-decision-eight.vercel.app/ mapped to production dpl_3H8AN1Q7Kjr6Vh8r8He9GivJL7a9; Vercel get_deployment independently reported READY with matching project, main branch, SHA and production target. Preview dpl_DqikrYYqAsuvjbkEgkZeujWWu1zc was READY; preview UI access was protected and unavailable (403 for the authenticated fetch). Protection was not weakened. GitHub terminal push credentials were unavailable; authorized connector created an exact source tree and fast-forwarded main. Local and remote tree equality was verified before release.

Supported live browser completed:
- Quick bedroom 18m², dust + noise needs, custom 25,000 equipment ceiling, priority reorder; answer-first result and budget unknown-price disclosures.
- Neutral feedback → reason chips → other optional synthetic text; continued product actions without blocking; rating/reason retained across result redraw. Exactly one survey rendered.
- Product card/detail, official href and clean unverified-image placeholders; no fabricated image/spec/price.
- Quote request actual clipboard success, synthetic manual store + 25,000 total + installation included; missing-scope questions shown and total not treated as equipment-only price.
- Decision Brief actual copy verified; actual .txt download was 3,307 bytes and included both Living/Dining plus selected 2-wall setup.
- Detailed 50m² Living+Dining, west sun/high glazing, open plan, 1-phase, partial use/long shape/independent control/ceiling available, value budget; configuration result, alternative wall comparison and selected two-zone wall products/brief.
- Positive and negative ratings and negative reason chip work. No contact/lead submission performed.

Source evidence: live DOM inline script fingerprint exactly matched tested application source (403,259 JS characters, FNV-1a 156592055). Vercel SHA is independent stronger release identity; fingerprint confirms delivered inline code, not a cryptographic integrity assertion. Live viewport 1363px, usable document width 1348px, centered result 424px wide (left 462, right 886), no horizontal overflow. Screenshot shows preserved narrow single-column result. Browser error scan contained extension metadata errors only; no application-origin errors observed in the scanned window.

Live manifest /manifest.webmanifest and width=device-width mobile viewport metadata confirmed. Automated 7 PWA tests pass. Real-device install/offline, actual live SW-controller/cache-update inspection and exact 390px browser execution remain unverified: cloud browser has no supported viewport/offline API and local browser binary could not be installed. Do not describe this as a complete device/PWA sign-off.

Follow-up telemetry refinement separates exact/near/catalog product coverage from setup fit/site-check, and derives budget bands from existing per-zone Budget Reality Check rather than a new threshold. Three dedicated checks added; 246 automated cases pass. No catalog, matching, visible decision flow or price data changed. Final follow-up deployment/source identity is reported in the delivery message after READY verification.

## Files changed (implementation)

index.html; scripts/analytics-layer.js; scripts/sync-analytics-layer.cjs; scripts/cooling-layer.js (event bridge only); sw.js (cache version); docs/HOME_DECISION_MASTER_SPEC.md; docs/PRIVATE_BETA_METRICS.md; docs/PRIVATE_BETA_LAUNCH_GATE.md; reports/validation/SPRINT_A_QA.md; reports/validation/HVAC_REVIEW.md; reports/validation/HVAC_SCENARIOS.json; tests/beta-scenarios.cjs; tests/test_beta_scenarios.cjs; tests/test_beta_analytics.cjs; tests/test_beta_actions.cjs; tests/test_browser.cjs; tests/test_configuration.cjs (allowlisted schema assertion); tests/test_pwa.cjs (cache fixture); .github/workflows/decision-tests.yml.
