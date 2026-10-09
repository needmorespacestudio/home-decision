# Phase 2 — Aircon recommendation and catalog QA (2026-10-09)

This is a **repository coverage audit**, not a live retail price, stock or technical certification. Run `python3 scripts/audit_phase2_catalog.py` for current counts. It validates evidence-field structure and inventories gaps without changing or claiming to refresh manufacturer data.

Baseline observed before changes: **53 SKU records, 10 brands, 30 marked recommendation-ready**. Among those 30, **30 lacked a verified equipment price**, **7 lacked verified electrical phase**, and **30 had no confirmed active lifecycle**. Do **not** show made-up market prices, claim models are currently on sale, call them a verified cheapest choice, or label them unconditionally purchase-ready. Inherited official source links and checked dates are not proof of October retail availability. Noise, Wi-Fi, filtration and efficiency must be claimed only when their exact fields have evidence.

Top 3 now explains the existing algorithm's *order* and observable trade-offs, labels equipment-price samples as provisional or missing, separates installation cost and warns on phase/availability evidence. No percentage match or sponsorship influence is invented. Some eligible rooms can legitimately have 0–2 catalog candidates; give a clear no-match outcome rather than fabricating three. For large/open/unclear rooms, survey-first remains required; alternatives are configuration discussions, not purchasable product recommendations.

Browser test scenarios (390px mobile and 1280px desktop): closed bedrooms 12, 16 and 20 m²; closed living room 30 m²; connected living+dining 50 m²; uncertain closure 16 m². CI is functional consistency only. **Independent HVAC expert validation, retail stock checks and current quote-based prices are not completed** and should not be claimed as passed.

Release criteria: CI both workflows green on head, Vercel Preview READY and source SHA verified; merge only when no critical findings. After merge require Production READY with matching commit and canonical alias, not a previous cached deployment.
