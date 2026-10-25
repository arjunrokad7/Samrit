# Known limitations and recommended next steps

This is a prioritized proposal for a real pilot and eventual larger deployment. Items below are not claimed as completed features. The first milestone is trustworthy operation with a small verified partner network, not maximum scale or maximum AI usage.

## 1. Before using real food-seeker or operational data

| Priority | Recommendation | Why it matters | Acceptance evidence |
| --- | --- | --- | --- |
| P0 | Name an NGO service owner and a food-safety/incident owner | Software cannot decide who takes responsibility when a meal or delivery goes wrong | Written ownership, escalation contacts and a rehearsed incident scenario |
| P0 | Verify real partner sites, hours, eligibility and capacities | Public facility listings are not operating agreements or live service promises | Staff-confirmed records with verification dates and an update/closure process |
| P0 | Complete professional legal/food-safety review | Draft terms and copied statutory links are not approval to operate | Reviewed terms, consent, partner agreements and local operating procedures |
| P0 | Protect custody media with authenticated or signed retrieval | Current `/media/` serving does not enforce authorization per image | Access tests showing unrelated users and unauthenticated requests cannot retrieve protected files |
| P0 | Decide data minimization and retention | Times, coordinates and anonymous text may still identify vulnerable visitors | Documented collection purpose, access rules, deletion/retention schedule and provider-data policy |
| P0 | Remove demo credentials/data and rotate exposed secrets | Synthetic fixtures and shared credentials must not become real accounts | Separate environments, credentials inventory and a verified seed policy |
| P0 | Use HTTPS and test actual devices | Camera/geolocation depend on origin security, device behavior and permission choices | Real phone camera, denied-permission, screen-reader and poor-network walkthroughs |
| P0 | Add reliable address geocoding/coordinate confirmation | Typing an address currently does not move its recorded coordinates | User-confirmed pin/address correspondence and proximity tests at actual sites |

Food handling should be designed with qualified operators. Do not add a generic AI “safe to eat” button. Define the evidence staff must inspect, the conditions requiring rejection/escalation, and how physical action is recorded without confusing it with a database status.

## 2. Run a controlled partner pilot

### Make availability verifiable

Add a center-facing workflow for publishing actual meal offers with service windows, portion updates, ingredient/allergen declarations, eligibility and a last-confirmed timestamp. Do not automatically convert every delivered batch into an available public meal; receipt does not establish when/how it is served.

Define expiration/closure behavior so stale offers disappear or become explicitly unconfirmed. Measure the fraction of active offers confirmed recently, not just the number of imported locations. Give partners a way to pause service immediately.

### Improve usability without requiring an account

Test the meal-finding journey with the people it is intended to serve, including people with low digital literacy, low-bandwidth access, older devices, limited English and accessibility needs. Investigate multiple languages, larger touch targets, reduced data use and a list-first fallback when maps fail.

Validate contrast, keyboard order, focus behavior, dialog trapping, status announcements and target sizes against the selected accessibility target using the [W3C accessibility guidance](https://www.w3.org/WAI/standards-guidelines/wcag/). Do not describe the prototype as certified or fully accessible based only on automated checks. Reassess the visually hidden page scrollbar with actual users.

### Make private feedback useful and accountable

Extend the review queue into case management: assigned reviewer, response deadline, evidence requests, disposition, follow-up and appeal/correction paths. Preserve uncertainty and allow reports from people who received no meal.

Review the handoff-sentiment routing heuristic before it affects real allocations. Raw negative counts can reflect uneven traffic, reporting behavior or repeated allegations. Consider human-approved service flags, recency, investigation outcome and proportional context rather than an unexplained penalty.

Do not add identity checks solely to manufacture a high-confidence review score. First evaluate whether extra data is necessary, whether it creates exclusion and whether a less invasive process can answer the operational question.

### Integrate the NGO's existing systems

Agree on the source of truth for driver identity, shifts, availability, truck maintenance and equipment. Start with a reviewed import or a small API integration rather than duplicating the entire volunteer-management product.

Provide controlled credential recovery, stronger administrator authentication, session revocation and a safe process for offboarding staff. Keep vehicle readiness separate from a driver's availability and preserve assignment snapshots.

## 3. Engineering hardening

### Security and access

Use a threat model and the [OWASP API Security project](https://owasp.org/API-Security/) to review object-level authorization, administrative actions, uploads, resource consumption and provider integrations. Define trusted proxies explicitly; do not accept spoofable forwarded addresses as the basis of rate limiting without a deployment policy.

Move per-IP windows and concurrency coordination into shared infrastructure before running multiple API replicas. Add upload scanning/resource limits suitable for the file pipeline. Review dependency/security reports and make remediation an owned task instead of treating a green CodeQL execution as an absence of findings.

Separate development/demo/staging/production data. Use least-privilege database roles and an explicit migration release process. Introduce tenant scoping and cross-tenant access tests before serving independent coordinating NGOs.

### AI reliability and cost

Introduce persistent background jobs, bounded retries, idempotency and operator-visible job status for document/review processing. Set provider budgets, metrics and alert thresholds. Keep manual entry/review available during provider outages.

Create a versioned evaluation set for negation, misspellings, ambiguous requests, incomplete allergen/temperature/nutrition data, invoice ingredients, unreadable documents and prompt-injection attempts. Measure incorrect confident matches and extraction corrections, not just response speed. Avoid storing sensitive free-text examples without a lawful/policy basis.

### Routing and location

For larger delivery networks, evaluate a road-network routing provider that supports the relevant vehicle constraints. Compare its estimates with actual delivery observations. Do not present current straight-line connections as turn-by-turn instructions.

If introducing telemetry, define consent, sampling, retention, visibility and off-duty behavior first. GPS accuracy, timestamps and device status need explicit handling. Rotating/signed venue codes can reduce copying risk but add operational burden; evaluate them before changing the intentionally simple visitor workflow.

### Storage, recovery and scale

Move originals/evidence into private durable object storage with lifecycle rules and controlled retrieval. Establish recovery-point/recovery-time objectives, encrypted/off-site backups and tested storage-plus-database restores.

Load-test realistic workloads: directory reads, concurrent arrivals, large uploads, dispatch contention, provider delays and administrative review queries. Use bounded pagination and profile query plans before adding indexes blindly. PostgreSQL advisory locking currently protects correctness but broad serialization may become a throughput bottleneck.

Use a suitable map hosting/provider arrangement for expected traffic. Respect [OpenStreetMap's tile usage policy](https://operations.osmfoundation.org/policies/tiles/); the public demo tile endpoint is not an unlimited offline/bulk tile service.

## 4. Delivery quality and evidence

Replace or modernize the inherited optional browser CI suite with a job that provisions the current backend/frontend/database and runs the complete-flow test with deterministic fixtures. Keep live-provider checks separately scheduled/controlled so quota or provider incidents do not obscure application regressions.

Retain a small real-device acceptance checklist. Add upgrade/recovery tests against supported PostgreSQL versions, not only a fresh local database. Introduce visual regression coverage for critical mobile states and theme variants once the design is stable.

Create signed-off operating runbooks and train the pilot users. Reconcile actual observed behavior with the manual after each release; do not let documentation become another outdated source of instructions.

## 5. Suggested success measures

| Area | Useful measure | Avoid claiming |
| --- | --- | --- |
| Food discovery | Recently verified offers, failed-visit reports, time to find a suitable option | Imported location count equals meals available |
| Recovery | Accepted/delivered portions, expiry-related failures, reconciliation with staff records | Every delivered serving was eaten |
| Reliability | Successful custody completion, stale route rate, provider fallback rate, recovery drill outcome | A photo/hash guarantees food safety |
| Fairness | Review resolution time and outcomes across sites, unexplained allocation disparities | An LLM confidence label proves truth |
| Privacy | Access audits, retention compliance, unnecessary-field removal, incident response time | No account means no identifying data |
| Accessibility | Real-user task completion and audited barriers | Automated checks alone certify accessibility |

If reporting environmental or financial impact, document the conversion factors, measurement basis and uncertainty. Do not inherit an old CO₂/karma formula and present it as a verified outcome of this version.

## 6. Recommended release sequence

1. Final submission: stable demo, honest boundaries, reproducible tests and complete documentation.
2. Small supervised pilot: verified partner locations, safe operating procedures, protected storage and privacy/access decisions.
3. Reliable operational release: monitored queues, tested recovery, credential lifecycle and incident case management.
4. Measured expansion: availability publication, accessibility/language improvements, external NGO integrations and stronger route planning.
5. Multi-organization scale: tenant isolation, workload/fairness evaluation, capacity planning and independently assessed controls.

Advance only when evidence supports the next stage. The purpose of the platform is dependable food access and accountable recovery, not a larger feature checklist.
