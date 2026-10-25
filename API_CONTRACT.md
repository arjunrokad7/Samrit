# Current Samrit API contract

Local base URL: `http://localhost:3000`. The active controller/contracts and shared types are authoritative. See the [architecture](docs/ARCHITECTURE.md) for relationships and the [legacy API reference](docs/LEGACY_API_CONTRACT.md) for inherited endpoints not listed here.

## Authentication and responses

Authenticated routes require `Authorization: Bearer <JWT>` from `/auth/login`. Public consumer discovery/visit routes do not require an account. Visit finish/review operations require opaque visit credentials instead. Every authenticated domain operation additionally checks account activity, role and relevant ownership/assignment.

Samrit operational controllers generally return `{ "success": true, "data": ..., "code": 200 }` and structured error envelopes. Evidence/consumer controllers return `{ "success": true, "data": ... }`; errors may use Nest's `{ "statusCode": ..., "message": ... }` shape. Auth retains its existing wrapper. Clients must check the HTTP status and handle `message`/`error`, rather than assuming every endpoint uses one identical envelope.

JSON is used except multipart uploads. Unknown fields are rejected by strict contracts where declared. Some nested schemas strip unsupported properties rather than accepting them as trusted fields. Core ownership, role, status transitions, proof locations/URLs and timestamps are assigned/validated server-side. Metadata objects cannot replace those fields.

## Public discovery and visits

| Method | Endpoint | Input / result |
| --- | --- | --- |
| GET | `/api/consumer/catalog` | Current database catalog; fictional offers remain labeled demo |
| GET | `/api/consumer/directory` | Public facility records with source and unverified-availability boundaries |
| POST | `/api/consumer/search` | `text` (2–500 characters), selected US `allergens`; validated Gemini yes/no/unknown decisions for eligible catalog IDs |
| POST | `/api/consumer/visits/scan` | `code`, `phase: "entry"`, `method: "camera" or "manual"`, optional device timestamp and location; returns visit ID, secret, venue and server arrival time |
| POST | `/api/consumer/visits/finish` | `visitId`, `secret`; stores first completion time and button method |
| POST | `/api/consumer/visits/review` | `visitId`, `secret`, positive/negative `sentiment`, optional written `rawText` up to 3,000 characters; requires arrival and completion, once per visit |

There is no current exit-scan operation. The scan contract accepts entry only. Visitor location is optional; when supplied it has `latitude`, `longitude` and `accuracyMeters`. Completion does not collect exit GPS. Keep returned secrets out of logs and URLs. The client holds them in page memory, so reloading currently loses the resumable session.

Search and evidence routes have per-IP request windows; gateway calls also have a concurrency limit. These limits are process-local in the current implementation. Provider failures cannot be treated as successful smart filtering.

## Identity

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/auth/register` | Public donor/center registration; administrative and driver roles are not public sign-up categories |
| POST | `/auth/login` | Credentials; rejects invalid/inactive accounts |
| GET | `/auth/profile` | Authenticated current account |
| PATCH | `/auth/profile` | Restricted profile fields; driver availability/equipment and driver GPS must use managed fleet operations |

## Events, documents, centers and batches

| Method | Endpoint | Access / input |
| --- | --- | --- |
| GET | `/api/samrit/overview` | Active account; role-filtered network records, private reviews only for admin |
| POST | `/api/events` | Donor: event name/time/location, confirmed items, notes, optional document IDs/metadata |
| POST | `/api/event-documents` | Donor: multipart `image`, `documentType` menu/invoice; saves private original and extraction candidates |
| GET | `/api/event-documents/:id/original` | Uploader or admin; private attachment response, no-store |
| POST | `/api/llm/ocr` | Compatibility upload route into the same persisted document workflow |
| PUT | `/api/centers/profile` | Center: location/time zone, hours, handling/storage capability, capacity, seating and staffing |
| PATCH | `/api/centers/:id/approve` | Admin approval |
| POST | `/api/centers/:id/visit-codes` | Compatibility endpoint for authorized center/admin; returns current shared entry value, not an exit pair |
| POST | `/api/photos` | Role/stage-appropriate multipart image, stage and coordinates; returns proof/photo ID |
| POST | `/api/batches` | Donor: own event, confirmed leftover items, handling, future expiry, new Stage 1 photo ID, optional metadata |
| PUT | `/api/batches/:id/photo` | Assigned driver at Stage 2 or receiving center at Stage 3; multipart proof/GPS, container sticker required for final intake |
| PATCH | `/api/batches/:id/reject` | Admin quality rejection with recorded reason; cannot casually reverse finalized delivery |

Menu/invoice files accept JPEG/PNG/WebP/PDF up to 5 MB after signature checks. Custody photos accept JPEG/PNG/WebP only. OCR outputs are unverified candidates, not confirmed dishes. Original documents and candidates must belong to the saving donor/event. Manual confirmation is required even when AI extraction succeeded.

### Confirmed menu item

```json
{
  "name": "Hot vegetable soup",
  "ingredients": ["Carrots", "Potatoes", "Water"],
  "allergens": [],
  "estimatedServings": 30,
  "handlingRequirement": "hot",
  "verified": true,
  "metadata": { "notes": "Packaging notes" }
}
```

Handling is `hot`, `refrigerated`, `frozen` or `shelf_stable`. An empty declaration is not an allergen-free guarantee. Metadata is a bounded JSON object. Leftover batches reference the confirmed menu and cannot allocate unknown items, change core declarations or exceed remaining recorded portions. Mixed handling needs separate batches.

## Fleet, dispatch and custody

| Method | Endpoint | Access / input |
| --- | --- | --- |
| POST | `/api/fleet/drivers` | Admin: identity, issued password, base location and availability |
| PATCH | `/api/fleet/drivers/:id` | Admin-managed driver fields; busy-driver restrictions apply |
| POST | `/api/fleet/vehicles` | Admin: unique registration, capacity, capabilities, equipment and readiness |
| PUT | `/api/fleet/vehicles/:id` | Admin; editing active-route vehicles is blocked |
| POST | `/api/fleet/location` | Driver's explicit current GPS report |
| POST | `/api/logistics/match` | Admin: required `batchId`, `driverId`, `vehicleId`; compatible/free resources and eligible center required |
| PATCH | `/api/logistics/routes/:id/cancel` | Admin: reason; only before collection/pickup evidence |
| POST | `/api/logistics/scan` | Assigned driver: batch, `kind: event or center`, QR value and proximity-checked coordinates |
| POST | `/api/logistics/link-qr` | Assigned driver: batch, unused `qrStickerId` and coordinates; pickup evidence required |

The venue value is shared with visitor check-in, but the driver operation still requires assignment and custody context. Container stickers remain distinct from event/venue QR codes. Route connections are planning estimates; this API does not provide a traffic-aware road optimizer.

## Private review operations

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/reviews/process` | Receiving center: delivered batch, valid donor/center target, sentiment and text |
| GET | `/api/admin/visit-reviews` | Admin-only visit review/evidence/analysis queue |
| POST | `/api/admin/visit-reviews/:id/reviewed` | Admin records that a visit review was reviewed |

Analyses remain separate from raw reviews. Gemini flags, consistency and uncertainty support staff assessment; they do not establish truth or certify food. Failed analysis leaves manual review available. The reviewed action is not a complete case-resolution/appeal system.

## Typical failures

Expect non-2xx responses for invalid fields, forbidden role/ownership, inactive account, stale assignment, unavailable resources, unsupported uploads, failed provider/schema validation, incorrect scan/sticker order, wrong GPS proximity, expired food, duplicate visit reviews or exceeded limits. A UI button being enabled is not authority to bypass a server check.
