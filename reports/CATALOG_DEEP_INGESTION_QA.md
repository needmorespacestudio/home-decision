# Catalog Deep Ingestion — Batch A release candidate

2026-10-07. User authorized the sprint and safe verified Batch A release to main.

PDF: all 30 pages extracted and visually reviewed. 362 entries, 22 SKU-row brands, 324 distinct explicit reported codes; 38 ambiguous/bundle/color-family rows require identity review. 2 bundles, 18 grouped colors, 35 previous-year notes, 1 reported-versus-runtime spec conflict. Raw text/tables, continuations, row boxes and field receipts retained with SHA256.

Runtime: 51 → 53 records; wall 43 → 45, cassette 8 unchanged. Two freshly reviewed additions: Mitsubishi Electric MSY-KA15VF and Samsung F-AR70F12D1DWN. Readiness 51 → 30: 23 existing unclear-lifecycle records retained and withheld, 28 existing eligible plus 2 new. This is deliberately stricter than the old readiness flag; 30 does not mean every optional field was newly audited.

13 official exact-model candidates have partial field receipts. Four Haier candidates stay withheld because one page gives conflicting efficiency units; six Carrier candidates lack complete electrical/current-lifecycle evidence; Electrolux ESV127C1SA is explicitly discontinued. Samsung lifecycle ambiguity in scraped templates was resolved by inspecting the selected exact product in the rendered official browser: an enabled purchase link is visible. Stock and live price remain unknown. Report observations remain Tier C and are never auto-promoted.

Prices: 275 report amounts are historical snapshots, 87 missing. Scope unit-only 13 / includes-pipe 20 / unclear 329 (includes rows without price). No report price qualifies as a live budget sample. Existing five unclear/inherited price observations remain in history; budget needs live verified official/authorized unit-only samples checked within 30 days. No mixed-scope cost or savings assertion.

UI: one primary setup and up to two alternatives retained; Top3 cards remain first, more eligible options behind a disclosure. Catalog trust disclosure separates report entries/brands from ready models. Exact product images can use the clean existing fallback. Quick/Detailed/Special Needs/Top3/Budget/Product Detail/Quote/Brief/zoning preserved. PWA cache v7; network-first navigation and offline shell retained.

Validation: 56 Python catalog cases (46 new ingestion cases); 62 configuration; 53 recommendation (10 new trust/price cases); 7 PWA; 65 local browser checks at 390px and centered 1440px, including full HTML source match, manual quote/brief, images, setup changes, old-cache removal and offline entry. No page errors. Mirror and cooling-source sync pass; diff whitespace check passes.

Deployment: release candidate prepared; remote commit/Production READY/live exact-release checks are separate release evidence, recorded in the delivered final report after publication. Main parent ce3abe2c43ca4250e2a625601ff77570719df6a2. Vercel project prj_eBJq4YuuGiqSueFCmJAN06jhvY8F under team_aVJ9CiefWYcwQoaqgB44MCfJ. No access bypass or enabled scraper.

Remaining: full manufacturer denominator audits; broad common-capacity verification beyond these two candidates; current lifecycle for withheld legacy rows; resolve Haier units; Carrier electrical manuals; fresh scoped authorized prices; cassette 24/30/42K and larger/system models; long-tail Thai service evidence. Batch B/C/D remain reviewed follow-up work, not completed claims.

## Initial production verification

Application commit 73711a75322bd5dcb5da85188a0b7cf1f71d6b01 is on main. Project API independently reported production dpl_84VvCbkFPoDvvXs3bWiD5PxC4eDq READY; GitHub Vercel status succeeded. Public live inline-script SHA256 exactly matched the tested source. Supported browser verified Quick/mobile → new Samsung card → detail → quote fallback → brief, and Detailed 50m² → 2 wall zones → cassette alternative comparison/selection on desktop. Desktop content centers within the usable viewport (native scrollbar accounted for), with no horizontal overflow or console errors. External-network terminal runner was blocked; no bypass attempted. Local real-browser offline/cache tests passed; live offline simulation remains unverified. Final follow-up removes inconsistent unconfirmed price receipts (no numeric price or budget outcome changed), normalizes English casing/ambiguous brand aliases and records official lifecycle/electrical findings in the existing queue.
