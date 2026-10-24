# Work in parallel on Samrit

Everyone should receive the **whole source repository**. Its folders are already
separated by concern, but frontend/backend need shared contracts and relative
imports. Do not send different incomplete ZIPs to different members.

Use the ZIP as the initial handoff, then use one team-owned Git remote. Each
person clones that same remote, runs setup, and creates their own feature branch.
The ZIP excludes .git so it does not include local Git credentials/history.
The team repository is https://github.com/arjunrokad7/Samrit. Configure
that as origin and use a separate feature branch for each work area.

## Suggested ownership

| Area | Primary files |
| --- | --- |
| Donor workflow | frontend/src/samrit/Donor.tsx; donor/event portions of backend/src/samrit |
| Center and driver workflow | frontend/src/samrit/Center.tsx, Driver.tsx, components.tsx |
| Dispatch and private moderation | frontend/src/samrit/Admin.tsx; matching/review portions of backend/src/samrit/samrit.service.ts |
| Platform and integration | backend/src/auth, backend/src/samrit/contracts.ts, shared/types, scripts, Docker/CI |
| Shared visual language | frontend/src/samrit/design.ts, Sheet.tsx, frontend/tailwind.config.js, public/brand |

These are suggested work areas, not separate deployments or assigned people.
Agree on who owns shared files before editing them simultaneously. Backend
Samrit business logic is currently in one service; coordinate edits or extract
focused services in a reviewed change when parallel work needs it.

## Branch and integration flow

```sh
git switch -c feature/donor-menu
# implement one focused change
npm run build
npm test
```

Push a branch to your team remote and open a pull request when ready. Integrate
small changes frequently. Update API_CONTRACT.md, shared/types/samrit.ts, and
backend Zod contracts together for payload changes. Review contract changes with
members consuming that endpoint before merging.

Commit package.json **and its corresponding package-lock.json** when changing
dependencies. Teammates run npm run setup afterward to reproduce the locked tree.
Do not commit node_modules, local .env files, uploads, databases, or releases/ ZIPs.
Each teammate's local database and generated secrets are independent.

## Useful commands

- `npm run dev:backend` / `npm run dev:frontend`: run one app during focused work.
- `npm run dev`: run both apps.
- `npm run infra:up`: start PostgreSQL and Redis through Compose.
- `npm run infra:stop`: stop only those two project services; retain their volumes.
- `npm run doctor -- --services`: check local setup without printing credentials.
- `npm run seed:demo`: generate the fictional demo dataset on that installation.
- `npm run share`: rebuild the lightweight source ZIP and checksum.

## Deploying your team's copy

The existing Dockerfiles and Compose setup provide local dev/demo deployments.
For a shared hosted deployment, configure its own server-side secrets, persistent
PostgreSQL/Redis and photo storage, HTTPS, FRONTEND_URL for CORS, and the frontend's
public VITE_API_URL. Vite public values are compiled into production builds, so
set them before building; never place Gemini/JWT credentials in VITE_* values.
Camera/location access requires HTTPS outside localhost.

The optional pgAdmin service uses the `tools` Compose profile. Docker volume names
are scoped by COMPOSE_PROJECT_NAME; set distinct project names and host ports if
several copies run on one machine. Set BACKEND_PORT, FRONTEND_PORT, POSTGRES_PORT,
REDIS_PORT, and PGADMIN_PORT as needed, and align public URLs/CORS with those ports.
For different computers, the default localhost ports can be used independently.

The packaging process is validated locally. Docker is not installed on the
original implementation machine, so container builds must also be tested on a
teammate's Docker-capable device before choosing a hosted deployment process.
