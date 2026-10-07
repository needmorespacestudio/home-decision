# Answer-first Aircon UX

The static site keeps the existing capacity, installation, electrical, Special Needs and ranked-priority rules. UI changes introduce verified-price market context, a single budget ceiling, one initial recommendation with at most four reasons and one warning, progressive disclosure and a two-path quote entry.

## Browser regression

With Node.js, Playwright and Edge available, run `node tests/browser-regression.cjs https://home-decision-eight.vercel.app`. Install Playwright in your test environment; it is not a production dependency. Screenshots and results are written under `work/`.

The suite walks Quick (8 steps) and Detailed (14 steps) at 390×844 and 1440×1000. It checks all budget choices, price evidence, Special Needs exclusivity, Top 3 reordering, result disclosure, advanced edits, budget views, quote file selection/manual comparison, missing-price fallback, installation/electrical eligibility, horizontal overflow and uncaught JavaScript errors.

File upload remains a local file-selection workflow. There is no OCR backend configured; the UI explicitly tells users to enter known quote totals. Prices are verified catalogue unit prices, not installed totals or a claim about the entire market.
