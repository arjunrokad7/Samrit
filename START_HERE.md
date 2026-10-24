# Share and run Samrit

Share **releases/samrit-team.zip**, created with `npm run share`.
Do not ZIP the surrounding workspace, `.tools`, `node_modules`, or database folders.

The archive contains source, logos, sample fixtures, lockfiles, configuration
templates, setup scripts, and documentation. It does not contain your environment
credentials, actual database, uploads, browser binaries, Node installation, or Python.

## Teammate quick start: Windows, macOS, or Linux

1. Install Node.js **22.12 or later** (Node 22 LTS recommended) and npm 10+.
2. Install Docker with Compose v2, or use your own PostgreSQL 15+ and Redis servers.
3. Extract the ZIP and open a terminal in its **samrit** folder.
4. Run:

```sh
npm run setup
npm run infra:up
npm run doctor -- --services
npm run dev
```

In another terminal, from the same folder:

```sh
npm run seed:demo
```

Open **http://localhost:5173**. API documentation: http://localhost:3000/api.
`npm run setup` runs `npm ci` in backend/ and frontend/ using the exact lockfiles.
It generates local configuration and random local JWT/admin secrets, while
preserving existing environment files. It does not install system software or
start/change existing database servers.

If you already run PostgreSQL and Redis, skip `infra:up`. Update backend/.env to
match those services. The configured POSTGRES_DB must exist. Docker creates it
automatically on first initialization of its new database volume.

## Accounts and sample data

`npm run seed:demo` creates the demo accounts and five fictional NYC food batches,
center capabilities, assigned/completed routes, three-stage sample custody images,
and private feedback. It regenerates a demonstration; it does not import the
original developer's actual database or photos.

| Role | Email | Password |
| --- | --- | --- |
| Donor | donor@example.com | Demo123! |
| Center | ngo@example.com | Demo123! |
| Driver | volunteer@example.com | Demo123! |

The central admin email and generated password are in **backend/.env** under
SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD. Fresh setup defaults to admin@samrit.local.
An existing installation keeps its original admin account and configuration.

## Complete Docker stack

To run both applications inside containers, generate configuration, then build:

```sh
npm run setup -- --skip-install
docker compose up --build
```

Once the backend is ready, seed through its container:

```sh
docker compose exec backend node ../scripts/seed-samrit.cjs
```

`infra:up` is for running apps natively with just the two infrastructure containers.
The complete-stack command also uses ports 3000/5173; stop your native app processes
before starting the complete stack. Keep database/photo volumes for persistence.
These Compose defaults provide a local demo/dev environment, not a production
HTTPS/reverse-proxy setup.

## Important project files

```text
samrit/
  project.requirements.json   machine-readable prerequisites and restore commands
  package.json               root commands, no duplicated app dependencies
  package-lock.json          root command-package metadata
  backend/                   NestJS API + its dependency manifest and lockfile
  frontend/                  React app + its dependency manifest and lockfile
  shared/                    shared API/domain types
  scripts/                   setup, checks, demo seed, ZIP exporter
  docs/                      workflow, API/design context, team coordination
  .env.example               safe server/Compose template
  frontend/.env.example      safe public frontend template
```

No requirements.txt is needed: this is a Node application, and npm manifests plus
lockfiles are its dependency requirements. Python was only a utility on the
original developer's machine and is not an application dependency.

AI assistants: read **SETUP_FOR_AI.md** and **project.requirements.json**.
Team members: read **docs/TEAM_WORKFLOW.md** before starting overlapping changes.
