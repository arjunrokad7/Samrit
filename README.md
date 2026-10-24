# Samrit

Repository: https://github.com/arjunrokad7/Samrit

Food recovery from the event floor to a community meal, built for New York City.
Samrit coordinates event organizers, community kitchens, and drivers through
verified food handoffs. Product and design references are in docs/reference.

## Team handoff and new-machine setup

Start with [START_HERE.md](START_HERE.md). Run `npm run share` to generate the
source-only ZIP at `releases/samrit-team.zip`; give teammates that file, not the
surrounding workspace. Run `npm run setup` on each device to install exact locked
dependencies and create local configuration. No Python environment is required.

Machine-readable prerequisites: [project.requirements.json](project.requirements.json).
AI setup guide: [SETUP_FOR_AI.md](SETUP_FOR_AI.md).
Parallel development: [docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md).

## Run locally

Requirements: Node.js 22.12+, npm 10+, PostgreSQL 15+, and Redis. The default database is `samrit_db`; POSTGRES_DB can select an existing installation.

```powershell
Copy-Item .env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
# Edit backend/.env: use a random JWT_SECRET and your local database credentials.
npm --prefix backend ci
npm --prefix frontend ci
npm run dev
```

An existing workspace may already have configured ignored .env files and local
services. Setup preserves those files; do not overwrite them just to restart.

- Website: http://localhost:5173
- Consumer concept: http://localhost:5173/consumer
- API documentation: http://localhost:3000/api
- Health: http://localhost:3000/health

```powershell
npm run seed:demo
npm run build
npm test
npm run test:api
npm run test:ui:smoke
```

The API checks require running services, use temporary accounts, and clean up
only their own database records. UI checks use installed Chrome; alternatively
set CHROME_PATH to a compatible browser executable. Screenshots go to the
ignored `.screenshots` folder.

## Demo access in this workspace

| Workspace | Email | Password |
| --- | --- | --- |
| Event organizer | donor@example.com | Demo123! |
| Distribution center | ngo@example.com | Demo123! |
| Volunteer driver | volunteer@example.com | Demo123! |
| Central NGO | admin@samrit.local | SecureAdmin123! |

Use SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD from your local environment
for the central admin. Fresh installations default to admin@samrit.local.
Demo account credentials are for this local hackathon environment only.

The demo seed is localhost-only and skips events it has already created. It
creates five NYC batch scenarios: one completed with all three proofs, one
assigned to a driver, and three awaiting dispatch. Every sample evidence image
is visibly marked SYNTHETIC DEMO EVIDENCE. Locations, organizations, reviews,
GPS readings, and availability in these fixtures are fictional.

## Product workflows

- **Event organizers:** save pre-event menus, optionally extract a menu image,
  verify every dish/ingredient/allergen, then select leftovers and capture a
  stage 1 photo with device GPS.
- **Centers:** register hours, seating, staffing, refrigerators, hot holding,
  freezer, and serving capacity; display an entrance QR; scan the container
  sticker and record the stage 3 arrival photo.
- **Drivers:** declare availability and transport equipment, follow assigned
  routes, scan the event QR, photograph pickup, bind a unique container sticker,
  then scan the center entrance QR on arrival.
- **Central NGO:** approve centers, match batches, view routes and custody,
  reject unsafe batches with a reason, and read private quality reviews.
- **Consumers:** a separate mobile concept with sample dietary filtering,
  transit links, and a private-review preview. It does not save consumer data
  or advertise live meal availability.

## United States defaults

New York City / America/New_York, en-US, USD, miles, Fahrenheit, +1 phone
examples, US addresses, and the nine major US allergen categories. Event inputs
are interpreted in Eastern time even when a browser runs in another time zone;
records are stored as UTC ISO timestamps. Serving counts are used for capacity.
No conversion is applied to historical kilogram fields in the legacy database.

Sources: [FDA allergen list](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies),
[Gemini image API](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding),
[Gemini structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

## Architecture and implementation decisions

The running React/Vite, NestJS, PostgreSQL, and Redis foundation is retained.
Samrit domain records use transactional PostgreSQL JSONB documents and Zod
contracts, with shared TypeScript types. This implements the PRD workflows
without replacing the app with Next.js/Express/MongoDB. New APIs use the PRD's
`{ success, data, error?, code }` response envelope. Existing auth and legacy
endpoints retain their original envelopes for compatibility.

`frontend/src/samrit` is the active application. The original pages remain as
legacy source and regression tests; they are not mounted in the main router.
Legacy donation rows are separate from Samrit batches and are not silently
converted into custody-verified food. Existing feedback read endpoints are
restricted to the central admin, and public donation listings omit quality scores.

`backend/src/samrit` contains workflow contracts, persistence, matching, AI
integration, GPS scan audit records, and immutable custody proof references.
Concurrent handoffs/matching are serialized with a PostgreSQL transaction lock
to prevent double assignment and overbooking. This is appropriate for a small
hackathon deployment; a larger installation should use more granular locking.

## AI, maps, and photos

Menu vision is enabled only when GEMINI_MODEL and an authorized GEMINI_API_KEY
(or KEY1..KEY4) are configured on the server. The model ID is deliberately not
invented from the PRD's example. Provider JSON is validated, and human
verification remains mandatory. Without credentials, menu entry works manually
and the UI states that vision is unavailable.

Private review classification can use a configured local Qwen chat-completions
endpoint (QWEN_BASE_URL and QWEN_MODEL), then Gemini, then explicitly labeled
keyword rules. Extra authorized keys are selected round robin; provider errors
are surfaced without retrying through keys to evade quotas. No provider secret
is exposed through VITE_* configuration.

Maps use Leaflet/OpenStreetMap; Google Maps links open driving/transit directions.
Drawn routes and travel times are planning estimates, not live traffic or
road-network optimization. If background tiles cannot load, plotted markers
remain available with a visible message.

Custody photos are real uploaded image files stored in UPLOAD_DIR, with server
timestamps, submitted device coordinates, actor IDs, and SHA256 hashes. They do
not use the legacy mock Cloudinary upload. A mounted photo volume is required
when running containers. Browser GPS is user-device evidence and a proximity
check, not tamper-proof location attestation or a food-safety certification.
Camera/location access requires localhost or HTTPS. The mobile manifest enables
an app-like entry point; offline custody writes are intentionally not supported.

## Docker

```powershell
Copy-Item .env.example .env
# Set JWT_SECRET, admin credentials, and database password first.
docker compose up --build
# Optional database administration UI:
docker compose --profile tools up -d pgadmin
```

Compose includes service health checks, US time-zone settings, shared model
mounts for both apps, persistent database storage, and a custody-photo volume.
Docker was not installed on the implementation machine, so validation used the
native Node/PostgreSQL/Redis setup rather than a container build.

See [the workflow mapping](docs/WORKFLOW.md), [API contract](API_CONTRACT.md),
and [demo walkthrough](docs/DEMO.md). Licensing terms are in LICENSE; required third-party notices are in THIRD_PARTY_NOTICES.md.

The current palette, typography, logos, and Tailwind recipes are documented in
[Design language](docs/DESIGN_LANGUAGE.md).
