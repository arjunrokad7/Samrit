# Development improvements and business decisions

This record explains the final product's evolution, the business assumptions behind it, and the consequences of each choice. It records outcomes of development rather than treating every early PRD idea as implemented. Recommendations are marked separately from decisions already reflected in the application.

## 1. Product direction

### Decision 1: Food seekers come first on the landing page

**Earlier state:** finding a meal was easy to overlook beside participation/sign-in controls.

**Final choice:** the landing page prominently presents **Find a meal** and **Be a part of the solution**, with food-seeker access prominent and account-free. The participant path supports donors and centers, while existing drivers sign in with NGO credentials.

**Reason:** people arriving because they need food should not have to understand the logistics platform, choose an organizational role or create an account before finding the public experience.

**Consequences:** the public and operational journeys have separate entry points and data boundaries. Making the public UI easy to reach does not justify pretending demo meals are live; demonstration status remains visible.

### Decision 2: A central NGO coordinates operations

**Earlier state:** volunteer registration and self-declared transport equipment suggested an open marketplace of individual drivers.

**Final choice:** assume the central NGO already has a volunteer/staff-management system and access to trucks. Samrit supplies operational accounts, resource records and dispatch coordination. Drivers are provisioned by the NGO, not recruited through public sign-up.

**Reason:** recruitment, vetting, training, vehicle access and responsibility already belong to the coordinating organization. A driver selecting personal equipment does not establish what is installed on an NGO truck.

**Implemented changes:** public registration accepts donor/center roles; driver availability and equipment updates are restricted; driver pages show assigned vehicles read-only; admin screens manage people, trucks, capabilities, equipment and routes.

**Tradeoff:** this is not an external volunteer-management integration. It is also not a complete multi-NGO tenancy product. The internal role name `VOLUNTEER` remains for compatibility, while the UI uses NGO driver.

### Decision 3: Separate driver, vehicle and route identity

**Final choice:** a driver and a truck are independent resources. New dispatches require both. Vehicle capacities/capabilities are structured and routes retain assignment-time vehicle snapshots.

**Reason:** a person can drive different trucks, and equipment belongs to a specific vehicle. Treating a driver profile as a vehicle would make capacity and maintenance decisions unreliable.

**Controls:** one active route per driver/vehicle; ready-status checks; handling/capacity compatibility; active-vehicle edit locks; cancellation before collection; resource release after completion/cancellation.

**Compatibility:** historical routes without a vehicle ID remain readable. The system identifies missing historical details rather than fabricating a vehicle or discarding history.

## 2. Food discovery and experience design

### Decision 4: New York City and Eastern time are the working defaults

**Final choice:** NYC, `America/New_York`, `en-US`, USD, miles, Fahrenheit and US contact/address examples. The nine major US allergen labels are used consistently.

**Reason:** the project is demonstrated and intended for a USA environment, with New York explicitly selected. Consistent interpretation of event times matters more than whatever time zone a developer's laptop happens to use.

**Tradeoff:** localization defaults are not a complete country-specific compliance engine. Future regional expansion needs verified operating data, local procedures and independent legal review.

### Decision 5: Make desktop layouts use desktop space

**Earlier state:** the meal finder resembled a narrow mobile column even on a landscape screen.

**Final choice:** use the available desktop width for preferences, map and result cards, while retaining readable mobile stacking. Add a clear “Find a place that works for you” heading and check-in access near both the top and bottom.

**Reason:** searching, comparing locations and checking preferences should not require unnecessary scrolling on a large screen. At a venue, check-in should be discoverable without reaching the bottom of the meal list.

### Decision 6: Allergen selection uses a proper multi-select

**Evolution:** a single-select/extra-field arrangement was replaced by a searchable dropdown with selected chips inside the field. Selection initially differentiated label/checkbox removal behavior; that was simplified to avoid confusion.

**Final interaction:** clicking an option's name or checkbox toggles it. A chip is removed only through its cross. Search and select-all controls support multiple allergens.

**Reason:** common, predictable selection behavior reduces accidental changes. Structured allergen exclusion is deterministic; an LLM cannot restore an excluded meal.

**Boundary:** a missing declaration is not evidence that a meal is allergen-free, and software cannot verify cross-contact. The confirmation notice remains visible after the general help-text cleanup.

### Decision 7: Interpret natural-language preferences with explicit evidence

**Earlier state:** the free-text restriction field was a concept preview and did not filter results.

**Final choice:** explicit submission sends the note and server-controlled meal metadata to Gemini. Decisions must be `yes`, `no` or `unknown`, with exactly the supplied eligible meal IDs. Requests such as “I cannot eat cold food” are evaluated against declared serving temperature.

**Reason:** users naturally express restrictions in their own words, including negation and misspellings. Metadata-backed classification is more useful than pretending to search by a few literal keywords.

**Controls:** bounded notes, role-independent public endpoint, per-IP request limits, provider timeouts, concurrency limits, output validation, and deterministic allergens before AI. Unknown or unsupported suitability is not presented as a supported match. Submissions happen on demand rather than every keystroke.

**Tradeoff:** provider availability, cost and output variability remain. Nutrient facts, temperature and allergen absence must not be invented. The current meal catalog does not provide verified low-sodium data.

### Decision 8: Show real maps while separating real and fictional data

**Earlier state:** an illustrative map panel looked like a map but supplied no actual street geography.

**Final choice:** Leaflet/OpenStreetMap provides street tiles and markers. A separate public NYC directory presents sourced locations. Three fictional meal examples remain clearly identified as demo meals.

**Reason:** a real map improves orientation. However, a public facility record does not imply current food stock, a verified operating schedule or a Samrit partnership.

**Controls:** preserve attribution; retain raw source record, URL, retrieval time and content hash; do not generate fictional menus for real organizations; do not apply sample-dish suitability to unknown real-provider offerings.

**Tradeoff:** tiles depend on network access and the public tile service's policies. This is not offline mapping, road-network routing or a production commercial tile contract.

## 3. One venue QR and private feedback

### Decision 9: Move feedback out of the meal-search results

**Earlier state:** the meal-finder page exposed a feedback section without representing what happened during a venue visit.

**Final choice:** a separate check-in page records a visitor's arrival and subsequent completion, then accepts a private review. The visitor can review a visit even when they received no food.

**Reason:** searching for a suitable place and reporting a visit are different tasks. Requiring a visit context improves interpretation without requiring a food-seeker account.

### Decision 10: Replace the paired visitor QR model

The intermediate design proposed visitor entry and exit QR scans, in addition to the driver's existing center-location QR. Entry/exit scans would supply two location readings and a recorded interval. That produced three venue codes and additional scanning friction.

The final choice is **one venue check-in QR** shared by driver arrival and meal-visitor check-in, followed by a **Finish visit and leave a review** button for the visitor.

| Concern | Intermediate design | Final design |
| --- | --- | --- |
| Printed venue codes | Driver location + visitor entry + visitor exit | One shared venue check-in QR |
| Arrival | Separate driver/visitor values | Same value, role/flow-specific operation |
| Visitor completion | Scan exit QR | Press Finish in the app |
| Visitor location evidence | Entry and exit GPS, if captured | Optional arrival GPS only |
| Recorded interval | Between accepted scan timestamps | From arrival to Finish-button server timestamp |
| Review access | After both scans | After arrival and completion with the visit secret |

**Reason:** the product should not require people to locate another sign or scan again merely to express their experience. A driver and a meal visitor can use the same printed identifier without sharing permissions or changing the same record.

**Implementation:** approved centers' existing `SAMRIT:CENTER:...` values are registered for visitor entry lookup. New exit codes are not generated by the current UI. The finish endpoint validates the opaque visit secret and uses server time. Historical exit evidence is retained for existing visits, and migration records distinguish legacy exit completion from button completion.

**Tradeoff:** completion is self-reported in-app. No exit location is collected and no physical departure is verified. The simpler interaction deliberately gives up that second evidence point. A static code can be copied; it must not be treated as proof of identity or presence by itself.

### Decision 11: Keep reviews private and uncertainty explicit

**Final choice:** visitor and handoff reviews are central-NGO quality records, not public ratings. Gemini extracts concerns, summarizes observations and assesses consistency with supplied evidence. Staff review remains necessary.

**Reason:** the purpose is to improve service and investigate concerns, not create a public popularity contest or label people dishonest. A complaint about waiting should remain valid input even if no meal was obtained.

**Example:** a 45-minute interval plus “the line was too long; I left without food” can be considered together. It does not establish that all 45 minutes were spent in a queue, nor prove the statement true or false. Button completion makes the interval even more explicitly approximate.

**Implemented boundary:** visitor analysis produces flags, summary, consistency and uncertainties, with human review required. It does not assign a reliability score or issue sanctions. The older handoff-sentiment center-ranking heuristic is separate; its automatic allocation influence is a documented fairness/operations limitation, not an AI truth verdict.

**Privacy tradeoff:** no name/account is required for a visitor, but precise arrival location and timestamps can still identify a visit. The remaining short disclosure explains that data use. Anonymous interaction is not a promise that the evidence cannot be identifying.

## 4. Food, evidence and data architecture

### Decision 12: Confirm food before creating leftovers

**Final choice:** OCR proposes candidates; a donor/staff member confirms the actual menu. Leftover selection uses those confirmed items and cannot allocate more servings than were recorded as provided.

**Reason:** invoices, catering menus and actual served food are different sources of information. Ingredient purchases do not prove a particular prepared dish exists, and supplied portions are not leftover portions.

**Implemented changes:** separate document/extraction/candidate/menu records, confirmation links and actors, unresolved quantities/handling left unknown, bounded uploads, menu-vs-invoice task prompts and manual fallback.

**Tradeoff:** confirmation is still a human assertion. The application does not independently inspect the event or determine edible quantities. A richer post-confirmation amendment process is future work.

### Decision 13: Use one server-side Gemini gateway

**Earlier experiments:** independent call paths, multiple key aliases and an optional alternate local review provider complicated configuration.

**Final choice:** all active AI tasks use `GEMINI_API_KEY` and `GEMINI_MODEL` through a shared gateway, with separate task schemas/prompts and audited results. Old key-rotation/Qwen setup suggestions are not part of the supported final configuration.

**Reason:** the operator can understand which provider receives data, where failures occur and how to configure the deployment. Sharing a key does not mean sharing prompts or validation rules between unrelated tasks.

**Controls:** provider secrets stay on the server; document bytes and raw prompts are not copied into job logs; model outputs are validated; jobs store task/model/prompt version/input hash/result/status; unsupported output fails the task rather than becoming trusted application state.

**Failure behavior:** menu extraction offers manual entry; preference filtering does not pretend the note was applied; review intake falls back to manual review. These differences reflect the risk of each task, not a generic “AI succeeded” message.

### Decision 14: Replace JSON-only operational storage with relational records

**Earlier state:** Samrit-specific data used a generic PostgreSQL JSONB record table, which was convenient for initial iteration but weak for domain relationships.

**Final choice:** typed schemas cover identity, directory, food, logistics, evidence, feedback, audit and application infrastructure. UUIDs, foreign keys, join tables, checks and indexes enforce relationships. API projections preserve the existing frontend shapes.

**Reason:** events, menu items, batch portions, vehicles, routes, evidence, visits and reviews have meaningful ownership and lifecycle links. A single unstructured payload cannot enforce them as effectively.

**Migration decisions:** preserve existing account IDs and password hashes; keep the original JSON table as an unchanged recovery reference; backfill transactionally; verify record counts; disable runtime TypeORM synchronization; use additive, checksummed SQL migrations.

**Compatibility improvement:** the bootstrap now uses PostgreSQL-15-compatible column constraints rather than redundant newer-version named `NOT NULL` statements. This was found in CI, where the database version differed from the local development runtime.

### Decision 15: Keep miscellaneous data without weakening core fields

**Final choice:** add bounded object-valued JSONB `metadata` fields where extension is useful. Food notes are available in event planning; schema-level metadata also supports other domain records.

**Reason:** event-specific packaging, references or extra context should not force a schema change every time. At the same time, free-form notes must not replace serving counts, allergens, ownership, location or status.

**Control:** metadata must be an object within the size limit. It is not spread over core response fields to override trusted typed values. A universal miscellaneous-field editor is not implemented for every table simply because the database supports metadata.

### Decision 16: Preserve three-stage custody evidence

**Final choice:** donor photo → driver pickup photo → receiving-center photo, with actor/time/location/hash records and role-specific gates. Event, venue and container identifiers have distinct meanings.

**Reason:** a delivery is not completed merely because a driver presses an arrival button. The receiving center must participate, and the same container must remain traceable.

**Tradeoff:** file hashes help identify retained bytes; they do not prove when a photo was taken, whether its subject is genuine, whether food is safe or whether device GPS is truthful. Stronger anti-replay, private object-storage access and incident procedures are launch requirements.

## 5. Design and delivery improvements

### Decision 17: Evolve the established design language

The UI retains the supplied leaf/wordmark assets, green/teal/navy family, display typography and readable body typography. Lilita One and DM Sans are bundled through dependencies; a locally available licensed Telegraf can be preferred by the font stack, but an unlicensed font file is not shipped.

Mobile navigation was adjusted to avoid wrapping sign-in text awkwardly. Primary meal discovery and participant actions have clearer visual hierarchy. The footer layout on visitor check-in now fills short viewports without creating a blank strip beneath it.

### Decision 18: Offer a platform-wide dark theme

The theme follows device preference until a user chooses a saved light/dark setting. One accessible global control works across public pages and dashboards, with palette variables also covering dialogs, inputs, tables and map controls. Wordmarks switch to the suitable variant.

QR codes retain a white scanning surface. Photos and street tiles are not color-inverted. This protects content meaning and scanning rather than applying a blanket visual filter.

### Decision 19: Reduce technical input and visual noise

Donor latitude/longitude inputs were removed at the user's request. The address and current-location action remain; internal coordinates are still needed. This is a presentation change, not an implemented geocoding service.

The page scrollbar was visually hidden while maintaining wheel, keyboard and touch scrolling. Nested navigation controls can retain scrollbars. This choice requires real accessibility/usability validation before a public launch, because a visible scrollbar can be a useful discoverability cue.

### Decision 20: Move walkthrough text into documentation

Final submission cleanup removes repeated on-page descriptions of what features do, demo-login hints, preview-only messages, redundant camera instructions and long operational explanations. The guide, labels and form states now carry the workflow; detailed operating instructions belong in the manual.

Essential input labels, validation errors, confirmations, privacy/provider disclosures, allergen cautions, route-estimate limits and fictional-data indicators remain. “Remove help text” does not mean remove information necessary for informed use or misrepresent sample listings as real available food.

## 6. Reproducibility, collaboration and verification

### Decision 21: Share source and manifests rather than installed runtimes

The project keeps backend/frontend dependency manifests and lockfiles, a machine-readable requirements file and setup/doctor/share commands. Team archives exclude `node_modules`, local Node binaries, credentials, database files, backups and uploaded originals.

**Reason:** teammates should install exact dependencies on their own operating systems, not receive a huge ZIP containing one developer's machine-specific libraries. Python is not required.

### Decision 22: Keep provenance and required attribution

Samrit's repository and branding were separated from the earlier project identity, while the required MIT notice for included third-party code remains in `THIRD_PARTY_NOTICES.md`. Rebranding is not a claim that inherited code was independently authored from scratch.

Real directory data retains source provenance. City Harvest's published historical statistics are reference facts only; they do not become current fleet inventory or proof of partnership.

### Decision 23: Test the real workflow and distinguish simulation

Unit/frontend tests cover domain constraints and UI behavior. API tests exercise permissions, evidence order, allocation and cleanup. Isolated database checks validate fresh installation and constraints. The complete-flow script links browser interaction and real role APIs into one scenario.

The strict `--with-ai` mode requires actual Gemini OCR, preference decisions and review analysis. Core mode explicitly skips those assertions. Both use synthetic photos and controlled coordinates. QR payloads are submitted through scan fields/API paths; physical camera decoding and real-device GPS still need manual checks.

Each automated run creates unique resources, removes its fixtures and writes an ignored report/screenshots/QR artifacts. The manual test pack instead creates a persistent local event and usable QR images, avoiding confusion about an automated sticker that was deleted after a test.

### Decision 24: Repair CI instead of ignoring failures

Backend lint formatting/unused-variable failures were fixed. CI initializes the versioned database schema before E2E tests. The CodeQL workflow now scans the JavaScript/TypeScript repository once rather than twice with identical language/category configuration.

CodeQL still runs analysis. Where GitHub code-scanning publishing is unavailable, results are saved as a SARIF artifact instead of failing solely during upload. This does not enable paid repository features, publish security alerts or establish that there are no findings. The artifact must still be reviewed.

The inherited optional browser E2E suite targets older screens and has infrastructure limitations. The new complete-flow and smoke tests are the submission's current workflow evidence; replacing the legacy optional CI suite with a fully provisioned current browser job remains a roadmap item.

## 7. Decisions deliberately not claimed as complete

### Subsequent workflow corrections

Food-seeker entry remains prominent on the public landing page. Staff portals no longer link directly to Find a Meal, keeping donor, driver, distribution-center and administrator workspaces focused on their operational tasks.

Leftover dish selection is independent of its editable serving count. Clearing a count keeps the dish checked; every selected dish must have a positive whole-number count before submission. Batch handling now supports combinations of hot holding, refrigeration, deep freeze and shelf-stable food. Each confirmed menu item's handling remains authoritative in the normalized database; legacy single-type batches remain compatible. A combined batch requires a vehicle and destination supporting every included type, with capacity for the total servings. Foods needing different conditions remain separately packed.

The submission does not claim live meal inventory publication, external volunteer-system integration, continuous vehicle telemetry, traffic-aware routing, automatic food-safety verification, professional legal approval, production-grade tenant isolation, managed retention/deletion, hardened private custody-image serving, paid AI-service reliability or hardware camera/GPS certification.

These boundaries are part of the business design: a useful coordination prototype should be honest about what its records establish. The [Roadmap](ROADMAP.md) prioritizes the next controls by food-seeker trust, operator accountability and deployment risk.
