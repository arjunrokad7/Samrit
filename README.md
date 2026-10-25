# Samrit

**A place at the table. A community behind it.**

Samrit connects people looking for food with community resources and helps a central NGO recover event surplus through accountable pickup, dispatch and delivery. Built for New York City, the platform combines a public meal finder with workspaces for donors, distribution centers, NGO-managed drivers and administrators.

The submission is a working hackathon prototype. It includes real publicly listed NYC facilities, clearly separated fictional meal offers, and synthetic operational fixtures. It does not claim live food availability, verified partnerships, certified food safety or production readiness.

![Samrit landing page](docs/images/landing-light.png)

## What you can do

- **Find food without an account:** explore sample meals, select allergens, enter preferences such as “I cannot eat cold food,” and browse a sourced NYC assistance directory with maps.
- **Recover surplus:** extract menus or invoices with Gemini, confirm the actual food details, create an event, and record leftover portions with pickup evidence.
- **Coordinate NGO resources:** provision drivers, manage truck capabilities and equipment, approve centers, assign compatible resources, and monitor routes and reported locations.
- **Track custody:** record donor, pickup and receiving photos; scan the event and venue QRs; bind a unique container sticker; enforce permissions, GPS proximity and workflow order.
- **Collect private feedback:** use one shared venue check-in QR for delivery arrivals and meal visitors. Visitors finish in the app and submit a private review without an exit QR.
- **Support human oversight:** Gemini provides schema-validated extraction, matching and review assistance. Staff confirm food records and evaluate review analysis.
- **Use the interface on desktop or mobile:** persistent light/dark themes, keyboard-accessible controls, camera QR scanning and printed-code fallback.

## Start here

| Reader | Documentation |
| --- | --- |
| Judges and first-time readers | [Platform overview and documentation index](docs/README.md), [submission and demo guide](docs/SUBMISSION_GUIDE.md) |
| Food seekers, donors, centers, drivers and NGO admins | [Complete user manual](docs/USER_MANUAL.md) / [print-ready PDF](docs/USER_MANUAL.pdf) |
| Product reviewers | [Development improvements and business decisions](docs/DECISIONS_AND_IMPROVEMENTS.md) |
| Developers | [Architecture and data model](docs/ARCHITECTURE.md), [API contract](API_CONTRACT.md) |
| Deployers and operators | [Operations, deployment and recovery](docs/OPERATIONS.md) |
| Product owners | [Known limitations and prioritized roadmap](docs/ROADMAP.md) |
| Testers | [Automated complete-flow test](docs/COMPLETE_FLOW_TEST.md) |

## Technology

| Layer | Implementation |
| --- | --- |
| Web application | React, TypeScript, Vite, Tailwind CSS, React Router |
| API | NestJS with the Express adapter, JWT authentication, role checks and Zod contracts |
| Data | PostgreSQL 15+, relational schemas, foreign keys, constraints and versioned migrations |
| Cache / infrastructure | Redis 7, Docker Compose for local services |
| AI | One server-side Gemini gateway for filtering, menu/invoice extraction and private-review analysis |
| Maps and scanning | Leaflet/OpenStreetMap, browser geolocation, camera QR scanning and generated QR codes |
| Validation | Jest, Vitest, Playwright-based browser/API walkthroughs and isolated database checks |

No Python environment or pip requirements are needed. Exact JavaScript dependencies are recorded in the backend and frontend lockfiles.

## Run locally

Requirements: Node.js **22.12+**, npm **10+**, PostgreSQL **15+**, and Redis **7**. Docker with Compose v2 can provide the two infrastructure services.

```sh
git clone https://github.com/arjunrokad7/Samrit.git
cd Samrit
npm run setup
npm run infra:up
npm run doctor -- --services
npm run db:migrate
npm run db:seed
npm run dev
```

`setup` installs locked frontend/backend dependencies and creates private environment files, preserving existing configuration. Fresh setup generates local JWT/admin secrets. If you already have PostgreSQL/Redis, skip `infra:up` and configure `backend/.env` for those services. The configured database must exist; Compose creates its database on first volume initialization.

In a second terminal, after the backend is running:

```sh
npm run seed:demo
node scripts/seed-fleet.cjs
node scripts/seed-accounts.cjs
```

- Website: **http://localhost:5173**
- Public meal finder: **http://localhost:5173/consumer**
- Visitor check-in: **http://localhost:5173/consumer/check-in**
- Sign-in: **http://localhost:5173/login**
- API documentation: **http://localhost:3000/api**
- Health endpoint: **http://localhost:3000/health**

The demo seed is localhost-only. It creates or reuses fictional fixtures; it does not import another developer's database or reset existing routes. Optional `node scripts/seed-fleet.cjs --with-route` adds a synthetic route when its chosen driver and truck are free.

### Demo accounts

These credentials are **local test fixtures**, created by the commands above. They are not production credentials.

| Category | Email | Password |
| --- | --- | --- |
| Donor / event venue | `donor@example.com` | `Demo123!` |
| Distribution center | `ngo@example.com` | `Demo123!` |
| NGO driver | `driver.maya@example.com` | `DemoDriver123!` |
| Second NGO driver | `driver.jordan@example.com` | `DemoDriver123!` |
| Demo central admin | `admin.demo@example.com` | `DemoAdmin123!` |

The bootstrap administrator uses `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from the private backend environment. Fresh setup generates that password; it is not the demo admin password. Drivers are provisioned by the NGO and cannot register publicly. People finding food do not need an account.

## Configuration

| Settings | Purpose |
| --- | --- |
| `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL connection |
| `REDIS_HOST`, `REDIS_PORT` or `REDIS_URL` | Redis connection |
| `JWT_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | Authentication and initial administrator |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional server-only Gemini access; use a model available to your account |
| `UPLOAD_DIR`, `PRIVATE_DOCUMENT_DIR` | Custody-image and private document storage |
| `APP_CITY`, `APP_TIMEZONE`, `APP_LOCALE` | NYC / `America/New_York` / `en-US` defaults |
| `QR_MAX_DISTANCE_METERS` | Custody proximity threshold; default 250 m |
| `VITE_API_URL` | Public frontend API address; never store a provider secret in `VITE_*` settings |

Manual menus and the delivery workflow remain available without Gemini. Smart filtering reports an unavailable provider; review intake falls back to human review. Server environment changes require a backend restart. Full configuration and deployment guidance is in [Operations](docs/OPERATIONS.md).

## Test and build

```sh
npm run build
npm test
npm run test:database
npm run test:api
npm run test:ui:smoke
npm run test:complete
npm run test:complete -- --with-ai
```

Build/unit checks do not require a browser. Integration and browser checks need the running local services; browser checks use Chrome locally or a configured `CHROME_PATH`. The complete-flow test creates isolated fixtures, exercises the public UI and real role APIs, then cleans up. `--with-ai` requires real Gemini results for extraction, preference filtering and review analysis; provider failures fail those strict assertions.

Results, screenshots and generated test QR images go into ignored output folders. Automated QR fixtures are removed after the run and should not be used for a later manual demo. Generate a persistent local manual pack with:

```sh
node scripts/create-demo-test-pack.cjs
```

This creates a fresh test event and downloadable QR images, sample menu/invoice PDFs, synthetic stage photos and walkthrough instructions under `releases/demo-test-pack/`.

## Data, trust and current boundaries

- The checked-in import has **59 accepted NYC facility listings**, with source records and provenance from [NYC Open Data](https://data.cityofnewyork.us/City-Government/Facilities-Database/ji82-xba5). Public listings do not establish a Samrit partnership or current availability.
- Three fictional consumer meals support the preference-search demo. Dispatch records do not automatically publish live public meal offers in this version.
- Operational drivers, vehicles, routes, menu quantities and evidence in the demo are synthetic. Historical public NGO statistics are stored separately and never become dispatchable resources.
- GPS is client-reported; static QR codes can be copied; photos and hashes record custody but cannot certify food safety. Route lines and time estimates are planning approximations, not traffic-aware navigation.
- Visitor duration ends when the visitor presses Finish. It does not verify departure or queue duration. Feedback is restricted to central NGO review; AI is not a truth detector.
- Typing an address does not geocode it. Donor GPS uses the current-location action or configured defaults; verified geocoding is a production requirement.

See [Roadmap](docs/ROADMAP.md) for launch prerequisites, including partner verification, accessibility validation, storage access controls, distributed rate limiting, retention policies and independently reviewed food-safety/legal procedures.

## Share and collaborate

`npm run share` creates a source-only archive at `releases/samrit-team.zip`. It includes manifests, lockfiles, migrations, public seed data and documentation; it excludes dependencies, local runtimes, credentials, databases, backups and uploads. Read [Team workflow](docs/TEAM_WORKFLOW.md) before parallel development. The repository is [arjunrokad7/Samrit](https://github.com/arjunrokad7/Samrit).

## License and attribution

Samrit is distributed under the [MIT License](LICENSE). It builds on the existing Food Redistribution Platform foundation; required original notices are preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). OpenStreetMap attribution remains visible on maps. Public-source provenance is retained with imported records. Gemini and public data sources do not imply endorsement or partnership.
