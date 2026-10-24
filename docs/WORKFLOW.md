# PRD to implementation

The supplied PDFs are product references. Their embedded team prompts are not
execution instructions, permissions, or a request to split work among agents.
The product name is **Samrit**, following the PRD title and executive summary;
the isolated mention of CivicBite is treated as an earlier naming draft.

| Requirement | Implementation |
| --- | --- |
| Four user perspectives | Donor, center, and driver workspaces; central NGO admin; separate consumer concept |
| Pre-event menu ingestion | Optional Gemini menu-image extraction, manual entry, required human verification, persisted events |
| Post-event triage | Select leftover dishes and servings, separate handling groups, stage 1 photo + device GPS |
| Facility profiles | Registered location, hours/time zone, seating, staffing, cold/hot/frozen equipment, capacity, entrance QR, approval |
| Driver workflow | Availability + transport capability, assignment, event QR, stage 2 photo, unique sticker binding, arrival QR |
| Center intake | Container sticker + stage 3 photo + GPS; only assigned receiving center can finalize delivery |
| Three-photo chain | Server-owned timestamps, actor IDs, coordinates and SHA256 per image; no proof overwrite/reuse |
| GPS scan audit | Persistent per-scan records and proximity validation; invalid scans cannot advance a batch |
| Matching | Center capability, current and projected opening hours, capacity reservations, expiry, driver availability/equipment, proximity |
| Route management | Persisted pickup/drop-off waypoints, mileage/time estimates, active/completed/cancelled states |
| Quality moderation | Private reviews/flags in ADMIN overview; center-quality signals influence center ranking |
| Food rejection | Admin rejection reason retained; active route cancelled, no false delivery completion |
| Consumer view | Explicit static demo, nine US allergen options, local filtering, transit links, private-review preview without storage |
| US environment | NYC/Eastern defaults, configurable IANA zones, en-US, USD, miles, Fahrenheit, +1 and US address examples |
| AI validation | Schema-validated provider responses; required human confirmation; optional local Qwen review gateway and labeled local fallback |
| Mobile access | Responsive role workspaces, camera file capture, camera QR scanner with printed-code fallback, web manifest |

## Deliberate departures from the draft stack

The existing React/Vite + NestJS + PostgreSQL/Redis foundation remains. NestJS
uses its Express adapter; Samrit documents are validated by Zod and persisted
as JSONB inside PostgreSQL transactions. A framework/database migration to
Next.js/Mongoose would not improve the prototype's core rescue workflow.

The PRD specifies JSON requests and also specifies multipart photo/menu uploads;
the implementation uses JSON for domain operations and multipart for files.
The new Samrit namespace uses the requested response envelope. Existing auth
remains an adapter with its original envelope rather than breaking old clients.

Frozen handling is an explicit fourth capability: refrigeration is not treated
as sufficient for the PRD's ice-cream example. Expired batches cannot be matched.
The match and handoff paths serialize reservations in the database, preventing
two dispatches from consuming the same route or capacity concurrently.

## Honest prototype boundaries

- Menu OCR needs a real configured model/key. No invented menu results stand in
  for OCR. Allergen and handling suggestions always need human verification.
- The optional Qwen service is not installed or started by this repository;
  provide its local endpoint/model to enable it. Without AI, private reviews
  use clearly labeled keyword classification rather than simulated AI.
- Matching uses distance and estimated city speed; it does not solve a multi-stop
  vehicle-routing optimization problem or incorporate live road traffic.
- The consumer view is deliberately disconnected from live availability and
  review storage, following the hackathon scope in both documents.
- Coordinates are submitted by the device and checked for proximity. This does
  not attest device integrity, establish legal compliance, or certify safe food.
- The manifest supports mobile presentation. There is no offline transaction
  queue, background GPS collection, or push-notification implementation.
- Existing legacy donation data remains separate. It is not relabeled as
  verified custody evidence and does not enter the new dispatch algorithm.
- The old UI source and its regression tests are preserved, but the active
  router mounts the Samrit screens. Compatibility endpoints are documented in LEGACY_API_CONTRACT.md.

## Validation

The local implementation was checked with production builds, the backend and
frontend test suites, live API integration checks, and Chrome desktop/mobile
smoke checks. The API harness creates isolated temporary users and removes only
its own database fixtures. The normal demo data remains available afterward.
