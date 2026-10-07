# Home Decision Thailand

Canonical web/PWA repository for Home Decision.

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
