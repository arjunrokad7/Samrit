# Product requirements mapped to the final implementation

The supplied PRDs/design files are reference material. Their proposed stack, early role descriptions and embedded prompts do not override the final product decisions. The canonical product is Samrit.

| Requirement | Current implementation | Important boundary |
| --- | --- | --- |
| Food-seeker-first entry | Prominent Find a meal alongside Be a part of the solution | Public access does not imply live sample-meal availability |
| Multiple operational roles | Donor, center, NGO-managed driver, central admin | Four authenticated role categories; food seekers need no account |
| Menu ingestion | Gemini menu/invoice image/PDF extraction plus manual entry | Candidates need human confirmation |
| Event leftovers | Confirmed-menu selection, portions, use-by, Stage 1 photo/GPS | No unknown dish/mixed handling/excess portion allocation |
| Facility capabilities | Hours/time zone, seating, staffing, capacity, refrigeration/hot holding/freezer | Admin approval and actual operator verification are separate |
| Fleet ownership | Admin-provisioned drivers and independently managed trucks/equipment | No public driver signup or self-declared truck equipment |
| Dispatch | Explicit driver/vehicle, compatible eligible center, resource locks | Deterministic planning heuristics, not traffic-aware AI routing |
| Custody | Event QR, three role-specific photo proofs, unique sticker, center-arrival scan | GPS/photos/hashes do not certify safety or physical authenticity |
| Driver locations | Explicit reports, custody updates and source/time labels | No continuous tracking |
| Visitor check-in | One venue QR shared with delivery arrival | Public visit and authenticated custody are separate records |
| Visitor completion | Finish visit button, server time, private review | No new exit QR/GPS; duration is approximate |
| Quality feedback | Center handoff reviews and public-visitor reviews restricted to admin | Human review; no visitor-AI truth score or sanctions |
| Search | US allergen multi-select and validated Gemini yes/no/unknown matching | Missing data cannot establish suitability |
| Real directory | Provenance-backed NYC facilities and separate map | Unverified hours/service; not automatically partners |
| Persistence | PostgreSQL relational schemas, migrations, backfill, metadata and recovery tools | Legacy JSON table retained as recovery reference only |
| USA environment | NYC/Eastern/en-US/USD/miles/Fahrenheit defaults | Not a full jurisdiction-specific compliance engine |
| Interface | Responsive layouts, dark/light choice, scanning fallback, cleaned operational text | Physical-device and accessibility review still required |
| Collaboration | Source-only ZIP, manifests/lockfiles, setup/doctor scripts | No environments, uploads, database or installed runtimes shared |
| Validation | Unit/UI/API/database tests plus current hybrid full walkthrough | Physical camera/GPS and production load are separate acceptance work |

Detailed rationale: [Decisions and improvements](DECISIONS_AND_IMPROVEMENTS.md). Role instructions: [User manual](USER_MANUAL.md). Future scope: [Roadmap](ROADMAP.md).
