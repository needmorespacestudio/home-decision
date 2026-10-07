# Private Beta launch gate

Status: **Private Beta candidate; supervised internal QA ready. Unattended 20–50-person rollout pending.** Automated pass is not HVAC expert sign-off or real-user validation. See PRIVATE_BETA_METRICS.md and reports/validation/SPRINT_A_QA.md for evidence.

## Product readiness
- [x] Quick and Detailed runtime preserved; regression suite passes.
- [x] Configuration/zoning, Special Needs, ranked Top3 and all budget modes covered by automated checks.
- [x] Answer-first setup → capacity → products and at most two alternatives preserved.
- [x] Recommendation reasons/tradeoff and product/quote/brief paths retained.
- [ ] Real testers understand result within 2 minutes; measured task study required.
- [ ] Real testers find Quote path understandable; observed task study required.
- [x] Main application READY and exact-source live Quick/Detailed/product/Quote/Brief/feedback checks recorded in release QA.
- [ ] Exact 390px and real-device PWA install/offline/update sign-off; automation environment limitations recorded.

## Data readiness
- [x] Catalog disclosures distinguish Tier C discovery from eligible recommendation records; known unknowns preserved.
- [x] Historical/discontinued/unclear lifecycle and Tier C cannot enter recommendation normally.
- [x] PM2.5/noise/Wi-Fi/warranty missing evidence grants no fabricated capability.
- [ ] Common capacity coverage reviewed for actual beta use; gaps include cassette 24K/30K and complete current scoped prices.
- [ ] Fresh field/lifecycle audits for withheld legacy and additional models; no whole-market denominator known.

## Safety/domain readiness
- [x] 39 additional reproducible scenarios pass (plus 62 existing configuration cases).
- [x] Survey gates for large/connected/complex rooms and unknown electrical remain.
- [ ] Independent HVAC review and recorded reviewer decision. Packet: reports/validation/HVAC_SCENARIOS.json and HVAC_REVIEW.md.

## Analytics readiness
- [x] Core privacy-safe event hooks and in-memory debug summaries implemented.
- [x] Feedback chips and optional DOM-only other text; no actions blocked.
- [x] No identity/room answers/quote contents/contact/free text in analytics; no automatic transmission/storage.
- [ ] Collection backend/adapter, consent and retention approved and verified before unattended measurement.
- [ ] Real-user aggregation and Monthly Successful Decisions report; current aggregate is page lifetime only.

## Beta rollout readiness
- [ ] 20–50 target testers identified by owner; do not invent roster.
- [x] Tester instructions written below.
- [x] Supervised feedback capture ready; automatic cross-session capture pending backend.
- [x] Known limitations visible in result feedback disclosure, including HVAC review pending and manual quote fallback.
- [ ] Owner reviews limitations and HVAC advice, then decides rollout.

## Tester instructions

1. Open production on phone (~390px) and choose Quick using your real requirements. Do not put names/contact/address into feedback.
2. Read recommendation. Without help, explain preferred setup, main tradeoff and what must be checked on site. Facilitator times from result opening; target ≤2 minutes.
3. Open a product detail/official source or compare one alternative. Note uncertainty, missing desired brands and price clarity.
4. Copy the quote request or download a Decision Brief. Try manual store + total + installation-included comparison with a synthetic quote. Upload currently does not extract automatically.
5. Rate `ช่วยมาก / พอใช้ / ยังไม่ช่วย`; optionally choose one reason. Other text stays on this page only.
6. If supervised, facilitator records only aggregate task completion, time, rating, chip and confusion points with permission. Do not record private room inputs/quotes/contact. Reload loses local measurements.
7. Repeat Detailed only if useful. Do not buy or install solely from this preliminary estimate; survey flagged cases with technician/engineer.

Owner/facilitator fills observation and tester recruitment separately. No invitations were sent by this sprint.
