# Samrit demonstration

Use the [final submission and demonstration guide](SUBMISSION_GUIDE.md) for the current presentation sequence, accounts, acceptance checklist and honest prototype boundaries.

## Quick commands

With local services running and seeded:

```sh
node scripts/create-demo-test-pack.cjs
npm run test:complete
npm run test:complete -- --with-ai
```

The manual pack under `releases/demo-test-pack/` includes a new event's pickup QR, the approved demo center's shared venue QR, an unused container sticker, menu/invoice files, synthetic photos and its own instructions. Use its named event; a newly created OCR event has a different pickup QR.

There is no visitor exit QR. Visitors use the shared venue code, finish in the app and leave private feedback. Automated-run QR images are not reusable after fixture cleanup. Current fleet, permission and GPS gates remain active during the demo.

See [README demo access](../README.md#demo-accounts) and [User manual](USER_MANUAL.md) for role-specific details. Provider failure should be demonstrated as manual fallback, never presented as successful live AI.
