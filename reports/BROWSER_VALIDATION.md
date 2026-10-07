# Browser validation — Sprint 1 local candidate

Date 2026-10-07. Tested the static local app at http://127.0.0.1:8765 using the supported in-app browser.

| Check | Observed result |
|---|---|
| Quick flow | Eight steps completed; 15m² bedroom, night, low sun, PM2.5 need, wall, unlocked budget, quiet/saving/smart priorities |
| Result | New MHI SRK13YYS-W1/SRC13YYS-W1 appeared with four reasons, placeholder, installer warning and no invented price |
| Progressive specs | Exact pair, ranges, SEER, phase/voltage/frequency, noise mode/location, Wi-Fi, scoped features, warranty, lifecycle and unknown fields displayed |
| Product Detail | Exact new identity, image placeholder, manufacturer link and quote action present |
| Quote | Manual fallback expanded, test total 25,000 entered, quote result listed missing installation/VAT/written details; no external submission |
| Decision Brief | Room, load range, PM2.5 need, budget, ordered priorities and selected new model appeared |
| Detailed flow | Fourteen steps completed; 45m² Living+Dining, open plan, afternoon sun, four people, verified three-phase, cassette, 50,000 ceiling |
| Electrical/result | ME PLY-SM48EA4 (3 phase) selected; no confirmed single-phase record shown as compatible |
| Budget unknown | Result explicitly stated price unknown and ceiling unconfirmed; no free/zero price |
| Mobile 390px | Actual viewport 390; document width 375 (scrollbar), no horizontal overflow; reasons and actions fit |
| Desktop 1280px | Result width 424px, centered mobile layout; document width 1265 (scrollbar), no horizontal overflow |
| Browser console | Captured error logs empty |
| PWA | 7 execution tests: install shell, prior cache cleanup, network-first navigation, offline fallback, POST/external bypass and manifest. Real device install/offline transition not tested |
| Upload | Upload/camera affordances present; actual PDF/image selection and OCR were not tested or added |
| Production | Existing production home previously loaded. Candidate has not been deployed; full live candidate regression is pending |

The first browser attempt hit an area-validation alert after an extra Next action; a fresh tab completed both flows. This was not counted as a passing flow. Source/runtime compatibility is checked separately with the exact-mirror test.

Vercel project discovery identified home-decision / prj_eBJq4YuuGiqSueFCmJAN06jhvY8F / team_aVJ9CiefWYcwQoaqgB44MCfJ. Deployment listing returned HTTP 403: connected credentials lack the team's scope (panupongtr4-1388). No installed authenticated Vercel CLI fallback was available. READY and deployed SHA are unverified. Reconnect an account with access to this same team before claiming release success.
