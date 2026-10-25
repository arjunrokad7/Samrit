# Samrit documentation

This documentation describes the final submission's implemented behavior. Original PRDs and design references under `reference/` explain intent; they are not evidence that every proposed feature exists. Historical notes are identified explicitly below.

## Reading paths

| Goal | Read in order |
| --- | --- |
| Understand the project in five minutes | [Root README](../README.md), [submission guide](SUBMISSION_GUIDE.md) |
| Use a specific account | [User manual](USER_MANUAL.md) or [print-ready PDF](USER_MANUAL.pdf), then the relevant role chapter |
| Understand why the product changed | [Decisions and improvements](DECISIONS_AND_IMPROVEMENTS.md) |
| Install or deploy | [START_HERE](../START_HERE.md), [operations](OPERATIONS.md) |
| Extend the code | [Architecture](ARCHITECTURE.md), [API contract](../API_CONTRACT.md), [team workflow](TEAM_WORKFLOW.md) |
| Reproduce verification | [Complete-flow test guide](COMPLETE_FLOW_TEST.md), [submission checklist](SUBMISSION_GUIDE.md#5-submission-checklist) |
| Plan a real pilot | [Roadmap and launch boundaries](ROADMAP.md), [operations](OPERATIONS.md) |

## Product in one page

Samrit has five audiences and four authenticated role categories. Food seekers use the public site without registering. Donors offer event surplus. Distribution centers register their receiving capacity and complete intake. Drivers are existing NGO-managed personnel. A central NGO administrator controls approvals, drivers, trucks and dispatch.

The operational chain is: confirmed menu → leftover batch → compatible assignment → pickup evidence → container sticker → center arrival → receiving evidence → completed route. Public food-seeker check-in uses the same venue code as delivery arrival, but a separate visit record and permission model. A visitor finishes in the app and can leave private feedback even without receiving food.

Gemini assists with document extraction, preference matching and review analysis through one server-side gateway. PostgreSQL stores the authoritative domain relations. The demo separates public NYC location records from synthetic meals and fleet inventory. The current public directory is not a live service-availability feed.

## Current supporting documents

- [Submission validation record](VALIDATION_RECORD.md): commands actually exercised and their limits.
- [Database and AI implementation guide](DATABASE_AND_AI.md): schema-specific details and recovery tools; the single-QR model supersedes earlier paired-QR descriptions.
- [NGO fleet](NGO_FLEET.md): allocation rules, resource ownership and legacy-route compatibility.
- [Consumer smart search](CONSUMER_SMART_SEARCH.md): actual matching contract, data boundaries and failure behavior.
- [Product requirement mapping](WORKFLOW.md): current implementation traceability.
- [Demo script](DEMO.md): presenter-facing entry point.
- [Design language](DESIGN_LANGUAGE.md): brand references and typography.
- [Legal review notes](LEGAL_REVIEW.md): draft legal content and review requirements; not legal approval.

## Historical material

- [Consumer visit preview](CONSUMER_VISIT_PREVIEW.md) documents an earlier frontend-only, paired-QR experiment. That workflow is no longer current.
- [Legacy API contract](LEGACY_API_CONTRACT.md) describes inherited routes; new product workflows use the current [API contract](../API_CONTRACT.md).
- Files under `reference/` retain the supplied product and design background. Proposed technology choices and early role descriptions may differ from the final implementation.

For conflicts, use the role manual for operating instructions and the current code/migrations/API contracts for technical behavior. The decision history explains deliberate changes rather than silently treating early documents as current requirements.

## Rebuild the print manual

Edit `docs/USER_MANUAL.md`, then run `npm run docs:manual` from the project root. The generator uses the installed frontend browser tools and bundled fonts; it does not need the API, database or Python. It rebuilds the self-contained HTML and tagged PDF, computes chapter page numbers and verifies page boundaries and table placement. Major chapters start new A4 pages; tables stay intact. Screenshots used for visual verification go to ignored `.screenshots/`.
