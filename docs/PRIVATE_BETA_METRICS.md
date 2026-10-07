# Private Beta measurement contract — Sprint A

North Star: **Successful Home Decisions / Month**. Count at most one success per started decision: flow completed AND result shown AND either positive (`ช่วยมาก`) feedback or a meaningful action (product detail, official link, successful quote-request copy, successful brief copy, brief download initiated, alternative comparison). `พอใช้` alone is not positive evidence: capture it separately. A later rating revision changes feedback distribution but does not retract an already observed successful action/positive interaction. This metric measures engagement, not HVAC correctness or a completed purchase.

## Current collection and honest limits

`trackHD(name, payload, onceKey)` dispatches a sanitized `home-decision` CustomEvent; `scripts/analytics-layer.js` is synchronously embedded in index.html for offline operation. Legacy configuration/product events remain available. No vendor, paid service, network collector, cookies, random persistent identity or disk/session/localStorage event log. `window.hdAnalytics.report()` returns an in-memory aggregate for this page lifetime only; reload discards it. Flow counters are decisions, not unique people. No claimed real users or monthly KPI yet.

Deduplicate viewed/answered steps, initial result, recommendation, flag, product detail/source per product, and visible card per flow. Alternative/setup clicks retain intentional actions. Product card views use IntersectionObserver ≥50% visibility; hidden/collapsed products do not count. Returning to results does not complete another flow. Restart starts another decision. Explicit exit and pagehide mark incomplete flows abandoned once; mobile process kills cannot reliably fire. An abandoned flow resumed in browser history may later complete, so abandon observations are not final conversion failures. Copy events fire only after clipboard success; fallback prompt is not proof of copying. Download event means download initiation, not confirmation that a file was saved.

## Events

| Area | Events |
|---|---|
| Funnel | flow_started, flow_mode_selected, step_viewed, step_answered, flow_abandoned, flow_completed, result_shown |
| Configuration | recommended_setup_type, alternative_setup_opened, setup_selected, site_check_flagged, catalog_gap_shown |
| Products | product_card_viewed, product_detail_opened, official_link_clicked, price_link_clicked |
| Follow-through | quote_started, quote_message_copied, decision_brief_copied, decision_brief_downloaded |
| Feedback | feedback_submitted, feedback_reason_selected |
| Compatibility | configuration_result_shown, product_clicked |

Only fixed enum values for mode, step, setup, fit, budget status, rating, feedback reason, broad BTU bucket; bounded integer counts and site-check boolean. Product identifiers are internal dedup keys only, not payload. No selected answers, actual budget, dimensions, exact address, identity, contact, filename, uploaded contents, notes or arbitrary event fields. The `other` textarea is optional DOM-only text and never read by analytics, sent or saved. Existing optional demand/lead consent is separate and unchanged.

## Debug report and denominators

Run `window.hdAnalytics.report()` in developer tools. It returns starts, completions/completion_rate (completed / started), successful decisions, initial results, median elapsed time to initial result, step viewed/answered/abandoned counts, setup counts, fit counts/percentages, site-check percent, distinct-flow detail/official/quote-action rates, and current feedback distribution. Drop-off is viewed minus answered, preliminary for still active or mode-changing flows. Median sample retains latest 500 results; other aggregates cover page lifetime. Site-check/fit and action-rate denominator = initial results, not card renders or all visits. `exact` = exact products and setup fit; `near` = a zone uses near candidates without exact; `catalog_gap` = incomplete zone coverage; site_check/infeasible remain separate. Budget with missing verified full-setup equipment samples is unknown, not below market; status is preliminary equipment-only context. Exporting a synthetic report is not evidence of real beta traffic.

## Backend needed before unattended beta evidence

Choose a consent/privacy-reviewed first-party collector or vendor; no selection is implied by this sprint. Adapter listens to `home-decision` and forwards only `event.detail`, never auto-captures DOM/form values, URL query strings, user attributes, session replay or free text. Define jurisdiction/consent, purpose, retention, access/deletion policy, sampling/dedup and bot/test exclusion before enabling. Add ephemeral session/decision IDs and timestamps at the adapter only if needed and reviewed; no contact linkage. A first-party collector also processes unavoidable network IP logs: minimize/disclose them. Define monthly timezone Asia/Bangkok, stable event schema/version and unique decision joining, then aggregate reports across sessions. The present page-local debug counters cannot measure Monthly Successful Decisions or retain remote testers' responses.

No analytics is posted through the existing optional lead endpoint. Until a collector exists, use supervised sessions and manually transcribe aggregate/rating/chip observations with tester permission. Do not collect other-text or private room/quote details in a public report.
