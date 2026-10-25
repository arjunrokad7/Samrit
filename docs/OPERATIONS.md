# Installation, deployment and operations manual

## 1. Operating model

The current repository supports a local hackathon demonstration and development environment. Treat a public pilot as a separate release decision. A successful build or complete-flow report does not establish operational food safety, legal compliance, secure public storage or adequate staffing.

Use the canonical repository folder containing the root `package.json`, `backend/`, `frontend/`, `shared/` and `database/`. Do not run an old checkout merely because an IDE tab still points to it.

## 2. Prerequisites

| Dependency | Requirement / purpose |
| --- | --- |
| Node.js | 22.12 or newer; the team baseline is Node 22 |
| npm | Major version 10 or newer |
| PostgreSQL | Version 15 or newer; initialized database and suitable role |
| Redis | Version 7 recommended |
| Docker + Compose v2 | Optional local infrastructure/full-stack route |
| Chrome / Chromium | Browser smoke and complete-flow tests |
| Gemini key and model | Optional AI tasks; strict AI tests require working access |

Python, pip and a virtual environment are not required. Dependencies are installed from each application's package lockfile. Do not copy another developer's `node_modules`, database volume or runtime installation.

## 3. Fresh local installation

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

`setup` creates root/backend/frontend environments only where missing and generates local authentication/admin secrets for a fresh setup. Existing environment files are preserved. `infra:up` starts PostgreSQL and Redis; skip it when using already configured services. Compose initializes the configured database only on a new volume. Editing `POSTGRES_DB` later does not rename an existing database.

After startup, verify the health endpoint and open the web app. From another terminal:

```sh
npm run seed:demo
node scripts/seed-fleet.cjs
node scripts/seed-accounts.cjs
```

The public directory/catalog seed does not require an external API because its source snapshot is checked in. The operational seed runs against localhost and creates fictional data through the application's authorized workflows. Existing demo assignments may remain busy. Never delete the whole database simply to make a demonstration resource free.

### Existing installation

Preserve configuration and data. Take a backup, then run migration/build/validation steps. The migration runner checks applied checksums and initializes only missing schema work. It does not use TypeORM runtime synchronization to alter live tables.

Starting through the supported root/backend commands applies migrations before serving requests. E2E tests that instantiate `AppModule` directly must initialize their test database separately; the GitHub backend workflow includes that step.

## 4. Environment configuration

### Database and Redis

Configure `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. `DB_SSL=true` follows the application's current SSL option; production should review certificate verification rather than assume the development flag supplies a complete TLS policy.

Configure `REDIS_HOST`/`REDIS_PORT` or `REDIS_URL`, with authentication/TLS settings as required by the environment. Native app processes typically connect to `127.0.0.1`; Compose app containers use service hostnames such as `postgres` and `redis`.

The migration connection and running API must target the same database. Test runners also use that configuration for fixture cleanup; changing the API URL to another local process without matching the database settings can leave fixtures behind.

### Identity

Set a long random `JWT_SECRET`. Configure `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` privately for initial administrative access. Fresh setup generates secrets; the root README's demo admin account is a separate explicitly seeded fixture.

Do not enable public admin/driver registration to simplify a demonstration. Do not distribute real credentials in screenshots, README files or team ZIPs. Disable/remove demo accounts before a public pilot. Credential recovery, rotation, session lifecycle and multifactor support require further work.

### Gemini

Set `GEMINI_API_KEY` and a `GEMINI_MODEL` available to that provider account. Restart the API afterward. One gateway serves menu OCR, invoice OCR, preference filtering and private-review analysis. No extra Qwen endpoint or key-rotation aliases are needed in the supported final setup.

Without Gemini, manual event entry and custody still work. Search must report an unapplied note rather than manufacture matches. Reviews can be accepted for manual attention. Strict `--with-ai` tests intentionally fail if a fallback replaces the provider result.

Before real data is sent, the NGO must select the provider account, budget, access policy, retention/data-processing terms and allowed information. The code avoids raw-prompt job logs, but that does not eliminate the external disclosure itself.

### Region and web origin

Defaults are NYC, `America/New_York` and `en-US`. Use `FRONTEND_URL` for the allowed browser origin and `VITE_API_URL` for the API address visible to the frontend. A phone's `localhost` refers to the phone, not the developer computer. For a hosted demonstration, provide a reachable HTTPS origin/API pair and check CORS and camera/location permissions.

Frontend `VITE_*` values are public build-time inputs. Changing them requires a rebuild/restart as appropriate. They are never a place for database or provider passwords.

### Uploads

`UPLOAD_DIR` holds custody images; `PRIVATE_DOCUMENT_DIR` holds original menus/invoices. Keep the private directory outside the publicly served path. Both require durable storage for a hosted deployment. Ephemeral server filesystems are unsuitable for evidence that must survive a restart.

Current custody-image serving is static at `/media/`. Before real deployment, add authenticated/signed media delivery and define who may retrieve each evidence item. An unguessable filename alone is not an access-control policy.

## 5. Full local Docker stack

Generate environment files, then start the application containers:

```sh
npm run setup -- --skip-install
docker compose up --build
```

The Compose backend starts after healthy PostgreSQL/Redis services and runs migrations through its start command. It mounts source/configuration appropriately and has persistent volumes for custody and private-document storage. The complete stack is a local developer environment, not a ready-made production HTTPS gateway.

Seed inside the backend container as needed:

```sh
docker compose exec backend node ../scripts/db/seed-catalog.cjs
docker compose exec backend node ../scripts/db/import-nyc.cjs
docker compose exec backend node ../scripts/db/seed-statistics.cjs
docker compose exec backend node ../scripts/seed-samrit.cjs
docker compose exec backend node ../scripts/seed-fleet.cjs
docker compose exec backend node ../scripts/seed-accounts.cjs
```

Stop native processes that conflict with ports 3000/5173 before starting the complete container stack. `npm run infra:stop` stops infrastructure without removing its volumes. Destructive volume removal is not a normal troubleshooting step.

## 6. Database changes and import maintenance

### Migrations

Run `npm run db:migrate`. The runner applies ordered SQL and checksums, then backfills legacy records when appropriate. Keep each applied migration immutable. Review new constraints against historical data before adding them. Test a clean install and an upgrade path; they are different cases.

The generic legacy JSON table is retained for recovery comparison, not as an active second source of truth. Do not resume writing to it or run schema synchronization to “fix” a mismatch.

### Public directory updates

```sh
npm run db:import:nyc
```

This explicitly refreshes from the official NYC dataset and upserts provenance-bearing records. It may change counts as the source evolves. Review skipped/duplicate records and the imported snapshot before committing it. A facility disappearing from the sample or changing classification needs operator attention; the importer is not a complete service-verification system.

Do not convert dated public fleet statistics into available vehicle records. Do not auto-create accounts for real organizations merely because their names appear in a public dataset.

## 7. Build, tests and reports

| Command | Evidence / prerequisites |
| --- | --- |
| `npm run build` | TypeScript and production bundles |
| `npm test` | Backend unit/integration, frontend unit/UI and handoff/package checks |
| `npm run test:database` | Disposable-database schema/constraint checks; database-creation permissions |
| `npm run test:api` | Real custody/fleet authorization checks; running backend/database |
| `npm run test:ui:smoke` | Current role/public browser views; seeded accounts and Chrome |
| `npm run test:complete` | Linked browser/API walkthrough with disposable fixtures |
| `npm run test:complete -- --with-ai` | Same plus actual provider extraction/filtering/review assertions |
| `npm run test:evidence` | Focused live Gemini/document/visit/privacy checks |

Review `report.json`, not merely the last green console line. A failed cleanup causes the complete-flow run to fail. Normal cleanup removes its temporary accounts, allocations, visit records and uploaded fixtures. A force-killed process can leave test-prefixed data; investigate that specific run rather than wiping shared data.

Automated QR images belong to deleted fixtures and are evidence of a run, not reusable manual-demo credentials. Generate the manual test pack for persistent demo codes. Real-device camera/GPS tests remain separate from the simulated-coordinate and printed-code automation.

### GitHub Actions

Backend CI includes lint, type checking, tests, database initialization, E2E and build. CodeQL runs one repository-wide JavaScript/TypeScript analysis. If code-scanning upload is unavailable, retrieve the `codeql-sarif` artifact and review it; a green analysis job is not a statement that no findings exist.

The inherited optional frontend browser suite targets older application paths and does not provision the complete current backend. Do not use its optional status as the sole acceptance criterion. A dedicated provisioned CI job for the new complete-flow test is recommended before the next release.

## 8. Backup and recovery

### Make a database snapshot

```sh
npm run db:backup
```

The local logical snapshot includes schema-managed SQL, table data and a SHA-256 companion under ignored `backups/`. It contains password hashes and potentially private operational records. Restrict access and never commit or place it in a team archive.

The snapshot uses a consistent read and coordinates with migrations. It represents migration-managed application schemas, not every possible manual database object or an independently certified disaster-recovery strategy.

### Verify before relying on it

```sh
node scripts/db/verify-backup.cjs backups/<snapshot>.json
```

Verification validates the checksum, restores into a disposable database, rebuilds constraints, checks row counts and resets sequences. It requires appropriate database-creation and replication-role permissions. Restricted managed database accounts may not provide those privileges; use the provider's supported native backup/restore mechanisms there.

### Recover into a new database

```sh
node scripts/db/restore.cjs backups/<snapshot>.json new_recovery_database
```

The script refuses to overwrite an existing database. Review the recovered copy before pointing the API to it. Preserve the old configuration and original data until the recovery is accepted. Database restoration does not restore uploaded binary files; separately recover custody images and private originals at their expected paths, validating hashes where applicable.

For a real deployment, set recovery-point and recovery-time objectives with the NGO, encrypt/off-site backups, test restore drills, and manage storage/database consistency. Those operating agreements are not implemented merely by providing a local snapshot script.

## 9. Monitoring and incident response

At minimum, observe API health, PostgreSQL/Redis availability, disk/object-storage space, upload failure rates, expired/pending batches, route completion, provider error rates/latency, review backlog and abnormal request volume.

Use `app.ai_jobs` to distinguish provider failure from validation failure. Avoid placing raw reviews, document contents, coordinates or credentials into routine logs. Define who can inspect private records, for what purpose, and for how long.

For an operational food concern: pause the relevant handoff, contact responsible staff, isolate the physical issue under the NGO's procedures, preserve the batch/evidence identifiers and record the administrative decision. A model summary must not substitute for an incident owner.

For compromised credentials: revoke/rotate access through an approved administrative process, contain exposure and assess affected records. This prototype does not yet provide a full session-revocation/incident-management interface; do not assume password changes invalidate every existing token.

## 10. Scaling and security before public operation

Production work should include HTTPS, trusted-proxy configuration, shared rate-limit state, least-privilege database roles, controlled migration execution, access-controlled object storage, resilient background AI jobs, observability, retention/deletion policy, load testing and tenant scoping where needed.

Current per-IP windows and gateway concurrency state are in process memory. Multiple replicas do not automatically share those limits. Current route updates are explicitly reported/refreshed and are not a live telematics system. Provider delays can extend a request; a persistent queue with retry/idempotency policies is a future improvement.

The [Roadmap](ROADMAP.md) prioritizes these changes by operational consequence. The [User manual](USER_MANUAL.md) explains what each role can do now; neither document should be interpreted as professional food-safety or legal approval.
