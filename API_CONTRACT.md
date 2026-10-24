# Samrit API contract

Base URL: http://localhost:3000
All /api routes require a Bearer JWT from POST /auth/login. Their response shape:

```json
{"success":true,"data":{},"code":200}
```

Failures return the actual HTTP status and
`{"success":false,"data":null,"error":"Reason","code":400}`.
Identity, role, status, assignments, timestamps, and proof URLs are server owned.
Contracts reject unknown fields. Photos use multipart/form-data; other payloads
use application/json. Shared model types are in shared/types/samrit.ts; Zod
contracts are in backend/src/samrit/contracts.ts.

| Method | Endpoint | Role | Input / purpose |
| --- | --- | --- | --- |
| GET | /api/samrit/overview | Any active account | Role-filtered events, batches, centers, routes, scans; reviews and driver roster only for ADMIN |
| POST | /api/events | DONOR | name, scheduledAt, location, verified items, notes |
| PUT | /api/centers/profile | NGO | name, location, timeZone, capabilities, operatingHours, seating, staffing |
| PATCH | /api/centers/:id/approve | ADMIN | Approve registered center |
| POST | /api/photos | Stage-specific role | image, stage, lat, lng; returns photoId and proof |
| POST | /api/batches | DONOR | donorEventId, items, handlingRequirement, expiresAt, photoId |
| PUT | /api/batches/:id/photo | Assigned driver / receiving center | image, stage (2 or 3), lat, lng; sticker required at stage 3 |
| POST | /api/logistics/match | ADMIN | batchId, optional driverId |
| POST | /api/logistics/scan | Assigned VOLUNTEER | batchId, kind (event or center), value, lat, lng |
| POST | /api/logistics/link-qr | Assigned VOLUNTEER | batchId, qrStickerId, lat, lng |
| PATCH | /api/batches/:id/reject | ADMIN | reason (5-500 characters); cancels active route |
| POST | /api/reviews/process | Receiving NGO | targetType, targetId, linkedBatchId, sentiment, rawText |
| POST | /api/llm/ocr | DONOR | image; returns items requiring human verification |

Creation routes return HTTP 201; operations and reads return 200. Menu vision
returns 503 when no provider/model is configured. Unsupported image formats,
missing GPS, invalid custody order, mismatched stickers, insufficient equipment,
expired food, and capacity failures return explicit errors.

## Verified menu item

```json
{
  "name":"Roasted vegetable pasta",
  "ingredients":["Pasta","Tomatoes","Zucchini"],
  "allergens":["Wheat"],
  "estimatedServings":35,
  "handlingRequirement":"hot",
  "verified":true
}
```

Handling values: hot, refrigerated, frozen, shelf_stable. Split dishes with
different handling into separate batches. Allergen values: Milk, Eggs, Fish,
Crustacean shellfish, Tree nuts, Peanuts, Wheat, Soybeans, Sesame. An empty list
means no major allergens were declared; it does not establish absence or rule
out cross-contact. Humans must verify labels and ingredients.

Locations use `{ "lat":40.7306, "lng":-73.9866, "address":"... New York, NY ..." }`.
Times are ISO 8601 UTC strings. Operating hours use HH:MM in the center's IANA
time zone. Distances are miles; serving counts drive matching capacity.

## Enforced sequence

1. DONOR creates an event with verified menu items.
2. DONOR uploads stage 1 photo plus GPS, then creates a pending batch using its
   single-use photoId. Event must have started, food must not be expired, and
   photo GPS must be near the registered event.
3. ADMIN matches an open, approved, properly equipped center with remaining
   capacity and a free, available driver with suitable transport equipment.
4. Assigned driver scans `SAMRIT:EVENT:<eventId>` plus GPS at the pickup.
5. Assigned driver uploads stage 2 photo plus GPS.
6. Assigned driver links a globally unused sticker plus GPS. The batch becomes
   in_transit and the pickup waypoint becomes done. Sticker binding is permanent.
7. Assigned driver scans `SAMRIT:CENTER:<centerId>` plus GPS at the destination.
8. Receiving center scans the container sticker and uploads stage 3 photo plus
   GPS. Only then does the batch become delivered and its route completed.
9. Receiving center may submit feedback; only ADMIN can read review content and
   extracted quality flags. Other roles receive a submission acknowledgement.

The configured proximity threshold defaults to 250 meters. Every accepted scan
has its own actor, server timestamp, coordinates, batch, and scanned value.
Photo evidence cannot be replaced or reused across batches.

Legacy auth/notification/donation endpoints remain compatible with the original
app; their prior contract is retained in docs/LEGACY_API_CONTRACT.md. Their
records do not establish a Samrit custody chain. Legacy feedback GET routes are
now ADMIN-only, and public legacy donation responses omit donor quality scores.
