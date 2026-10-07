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
- 20 analytics/privacy/funnel checks PASS.
- Existing 62 configuration + 53 recommendation + 7 PWA cases PASS.
- 56 catalog tests PASS, no catalog content or readiness changes.
- Cooling/analytics runtime mirror checks and diff whitespace checks PASS.

6 clipboard/download action checks PASS.

Total 243 automated cases. Automated QA is independent from domain review and observed user comprehension.

Browser runner initially unavailable: installed Playwright package has no browser executable; official browser download did not produce a valid archive in this environment. No passing local browser run claimed. Existing browser suite remains available and is extended for this sprint; supported cloud browser is used for actual live interaction checks after deployment. Browser screenshots/390px evidence and real-device PWA installation are separate from VM assertions.

## Release evidence

Candidate not yet published when this report was written. Exact commit, deployment checks and live-source/UI evidence are added after publication. Vercel project prj_eBJq4YuuGiqSueFCmJAN06jhvY8F under team_aVJ9CiefWYcwQoaqgB44MCfJ; team-scoped API currently 403, no installed Vercel CLI. Do not claim observed READY until supported evidence exists.

## Remaining gates

Unattended measurement needs separately selected/privacy-reviewed backend, retention/consent and aggregation (current summary disappears on reload). HVAC review pending; 20–50 testers not recruited; real-user two-minute comprehension/quote task study pending. Catalog common-capacity/price/field coverage limits unchanged. Other free text is not remotely collected, and no tester invitations were sent.
