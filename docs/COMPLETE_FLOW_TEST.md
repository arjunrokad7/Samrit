# Automated complete-platform walkthrough

Run from the Samrit repository root with the backend, frontend, PostgreSQL and Redis running:

```powershell
npm run test:complete
```

Include live Gemini menu/invoice extraction, cold-food preference filtering and review-analysis assertions:

```powershell
npm run test:complete -- --with-ai
```

Watch the browser instead of running headless:

```powershell
npm run test:complete -- --with-ai --headed
```

This is a hybrid end-to-end test. Landing, theme persistence, legal pages, allergen selection, optional Gemini search, visitor check-in, finishing and review submission run through the real browser UI. Donor event creation, fleet assignment and delivery custody use the real HTTP APIs and PostgreSQL. Custody scans submit printed QR payloads; it does not test a physical webcam decoding a printed image. Browser geolocation and custody coordinates are explicitly simulated for local testing. Food photos are clearly synthetic fixtures.

## Prerequisites

- Run `npm run setup`, `npm run db:migrate`, `npm run db:seed`, then `npm run dev` if setting up a fresh checkout.
- Local backend defaults to `http://localhost:3000`; frontend defaults to `http://localhost:5173`. `SAMRIT_API_URL` and `E2E_BASE_URL` can select other localhost ports.
- The configured central admin must exist. The script reads `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from the private backend environment. Existing demo accounts are not modified.
- Local execution uses installed Google Chrome. Set `CHROME_PATH` to another installed Chromium-compatible executable if needed. Under `CI=true`, it uses Playwright's managed Chromium (`npx playwright install chromium` in `frontend/`).
- `--with-ai` requires the server's working `GEMINI_API_KEY`, `GEMINI_MODEL`, provider access and quota. The test requires actual Gemini results; manual fallbacks do not count as passing live-AI assertions.

Core mode skips OCR and smart-search assertions. Review submission still uses the backend's configured review processing, so it may call Gemini or use its normal manual-review fallback. Core mode does not claim that provider-dependent features passed.

## Checks

1. Desktop/mobile landing layout and persistent light/dark selection.
2. Terms/regulations pages, allergen exclusion/removal and public directory availability.
3. With AI: the browser applies “I cannot eat cold food” and excludes the explicitly cold sample meal.
4. Unique donor/center accounts and an admin-provisioned driver, hot-capable truck and approved center.
5. With AI: generated menu and invoice PDF extraction with unverified candidates. The test explicitly supplies confirmed dish values; a real deployment still requires staff review.
6. An unverified dish cannot be saved. A verified event produces actual event/venue/container QR image artifacts.
7. Leftovers cannot exceed recorded portions; donors cannot dispatch; occupied trucks cannot be edited.
8. Incorrect custody GPS is rejected, then the correct event scan, pickup photo, sticker link, venue arrival and center intake succeed.
9. All three evidence hashes exist and the route completes.
10. An unauthenticated visitor uses the same venue QR as the driver, can finish with a button, and submits a private review without an exit scan.
11. Finishing with the wrong visit secret, reviewing before finish and duplicate review submission are rejected.
12. Only the central admin sees the review. Analysis requires human review; `--with-ai` also requires Gemini mode.
13. No uncaught browser errors occur. Temporary operational records, test accounts and their uploaded files are removed.

## Reports and cleanup

Each run writes `test-results/complete-flow-<run-id>/report.json`, three generated QR PNGs and a visitor-review screenshot. Live-AI mode also writes its sample PDF. Failures save a screenshot and return a nonzero process exit code. Reports contain no passwords, API keys or sign-in tokens. These output directories are ignored by Git.

The QR images in an automated run are test evidence: their fixtures are deleted afterward, so use the separate manual demo test pack for QR images that should remain usable. The script creates fresh resources instead of consuming the manual pack's single-use container sticker.

The application rate limits remain enabled. If a preceding run used the same localhost request window, the script waits through a one-minute cooldown and retries once; it does not disable or bypass rate limiting. An unavailable app, invalid credentials, provider failure in strict AI mode, failed cleanup or unexpected response makes the run fail.

Cleanup runs on normal success and caught failures. Force-killing the process or losing the database connection may prevent cleanup; any residual accounts are identifiable by the `complete-<run-id>-...@example.com` prefix. Never run fixture tests against production; the script restricts target URLs to localhost.
