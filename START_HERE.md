# Run and share Samrit

Work from the folder containing this file and the root `package.json`. Install Node.js 22.12+ and npm 10+. Use Docker Compose v2 or existing PostgreSQL 15+/Redis 7 services. No Python setup is required.

## Fresh local setup

```sh
npm run setup
npm run infra:up
npm run doctor -- --services
npm run db:migrate
npm run db:seed
npm run dev
```

Setup installs backend/frontend dependencies from lockfiles, generates missing local configuration and preserves existing environments. For existing infrastructure, skip `infra:up` and configure `backend/.env`; the selected database must exist. Do not delete volumes to resolve a port/configuration problem.

Once the backend is ready, open another terminal:

```sh
npm run seed:demo
node scripts/seed-fleet.cjs
node scripts/seed-accounts.cjs
```

Open http://localhost:5173. API docs: http://localhost:3000/api. Health: http://localhost:3000/health. Demo account details and required configuration are in the [README](README.md). The bootstrap admin password is generated/configured privately, not copied from the demo account table.

## Walk through and test

```sh
npm run build
npm test
npm run test:complete
npm run test:complete -- --with-ai
```

Live-AI mode requires a working server Gemini key/model; core mode does not assert AI success. See the [complete-flow guide](docs/COMPLETE_FLOW_TEST.md). For reusable manual QR images and sample documents, run `node scripts/create-demo-test-pack.cjs`.

## Share with teammates

Run `npm run share` and distribute `releases/samrit-team.zip`. It contains source, lockfiles, migrations, public seed data, logos and documentation. It excludes installed dependencies, local runtimes, private environment files, uploaded documents/photos, backups and database volumes. Each teammate installs/configures their own environment and generates their own demo records. Local QR IDs are not portable across independent databases.

For a complete container stack, use `npm run setup -- --skip-install` followed by `docker compose up --build`; see [Operations](docs/OPERATIONS.md#5-full-local-docker-stack) for container seeding and storage details.

## Where to go next

- [Role-by-role user manual](docs/USER_MANUAL.md)
- [Business decisions and improvements](docs/DECISIONS_AND_IMPROVEMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Operations and recovery](docs/OPERATIONS.md)
- [Final submission guide](docs/SUBMISSION_GUIDE.md)
- [Prioritized roadmap](docs/ROADMAP.md)
- [Team workflow](docs/TEAM_WORKFLOW.md)
