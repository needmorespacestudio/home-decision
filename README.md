# Home Decision Thailand

Canonical web/PWA repository for Home Decision.

## Read first — canonical Product Constitution

Every Work session MUST read [docs/HOME_DECISION_MASTER_SPEC.md](docs/HOME_DECISION_MASTER_SPEC.md) before changing production. It is the canonical Single Source of Truth for UX, decision logic, trust, privacy and deployment. Record deliberate product changes in its Decision Log.

Catalog maintenance: [CATALOG_OPERATIONS](docs/CATALOG_OPERATIONS.md). Current structured catalog is a runtime-compatible mirror in `data/aircon_catalog.json`; scheduled watchers generate review-only artifacts and never promote recommendations. [Catalog health baseline](reports/latest/CATALOG_HEALTH.md) records measured completeness and unknown market denominators.

## Deployment policy
- `main` is production.
- Vercel Git integration should deploy every push to `main` to the same production alias.
- Feature work should use branches/preview deployments when changes are risky.
- Never expose server secrets in frontend files.

## Product principles
- Simple front-end, deep back-end.
- No login before first value.
- Product Match is separate from Data Confidence.
- No dead ends: generate a Decision Brief when exact matching is unavailable.
- Sponsors cannot influence organic matching/ranking.
- Coverage must be disclosed; do not claim market-best without audit.

## PWA
`manifest.webmanifest` + `sw.js` enable installability. Navigation is network-first to avoid trapping users on stale releases.

Current beta: [supervised runbook](docs/PRIVATE_BETA_RUNBOOK.md). Optional feedback exports download locally; aggregate voluntarily shared files with `scripts/beta_summary.py`. No automatic collector, monthly KPI or genuine Popular Choice percentages are enabled. Navigation and runtime scripts use fresh network responses with offline fallback.
