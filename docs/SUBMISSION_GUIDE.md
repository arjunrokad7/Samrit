# Final submission and demonstration guide

## 1. Submission summary

**Project:** Samrit — food access and accountable surplus-food recovery for New York City.

**Problem:** people need a straightforward way to discover food resources, while NGOs need dependable information about surplus, receiving capability, drivers, trucks and handoffs. Discovery and logistics often operate separately, and feedback can lose the context needed for responsible follow-up.

**Approach:** a food-seeker-first public experience plus coordinated donor, center, driver and NGO workspaces. Structured menu/portion data, custody evidence, compatible dispatch and private feedback connect the journey. Gemini assists with document extraction, preference interpretation and review analysis while humans retain operational responsibility.

**What is demonstrable:** account-free discovery, allergen multi-select, live-provider preference filtering when configured, real street maps/public directory, menu/invoice extraction with confirmation, leftover allocation, NGO-owned fleet assignment, three-stage custody, shared venue check-in and finish-button reviews, private moderation, dark/light appearance, relational persistence and automated verification.

**What is not claimed:** live public meal inventory, verified real-provider partnerships, continuous GPS tracking, traffic-aware routing, food-safety certification, truth detection, professional legal approval or hardened production deployment.

## 2. Prepare before presenting

1. Use a clean project checkout and the setup commands in the root README.
2. Confirm PostgreSQL, Redis, backend and frontend are available.
3. Apply migrations and public/catalog seeds; create operational demo accounts/fleet.
4. Check the configured Gemini model/key privately. Keep credentials out of the presentation window.
5. Generate a fresh manual test pack with `node scripts/create-demo-test-pack.cjs`.
6. Confirm a free compatible truck and driver. Seeded routes can already reserve them; create a dedicated demo resource or cancel an eligible uncollected route through the proper workflow.
7. Preflight camera and location permissions on the actual presentation device. For a remote desktop simulation, prepare browser Sensors overrides and label the coordinates as simulated.
8. Print/show the pack's QR sheet on a second screen. Have printed-code fallback available.
9. Run `npm run test:complete -- --with-ai` and inspect the report. Do not use its cleaned-up QR artifacts as persistent demo codes.
10. Keep a fallback plan: manual menu entry and core workflow can be demonstrated during a provider outage. Do not claim a fallback is a successful live AI extraction.

## 3. Suggested presentation sequence

### A. Food-seeker journey

Open the landing page. Show that Find a meal is prominent and no account is required. Show mobile sizing and the persistent theme toggle. Choose an allergen, remove it through its chip, and submit “I cannot eat cold food.” Point out the difference between a supported match and unknown suitability.

Open the real NYC directory/map. Explain the provenance and why it is separate from demo meals. Do not direct judges to fictional sample addresses as if real service exists.

### B. Donor planning and leftovers

Sign in as the donor. Show menu/invoice upload and the required human confirmation. For the prepared pack's event QR, choose its pre-created event in Leftover triage instead of creating a different event and expecting the old code to work.

Record 10 soup servings and 5 rice-bowl servings from the manual pack's provided menu. Use hot handling, a future deadline and the synthetic Stage 1 photo, explicitly identifying the evidence as a simulation.

### C. Central NGO dispatch

Show driver/vehicle management, readiness, capabilities and capacity. Explain why the product uses NGO-provisioned drivers and truck-owned equipment. Assign a free driver and compatible truck. The service selects an eligible receiving center; it is not a manual center-picker or an AI road optimizer.

Show the route and the source/time on reported location. Avoid describing it as continuous tracking.

### D. Driver and center custody

Use the event pickup QR, Stage 2 photo and unused container sticker. At the center, use the shared venue QR. Switch to the receiving-center account and complete intake with the same container sticker and Stage 3 photo.

Show the retained actor/time/location/hash evidence and completed route. Explain that evidence supports accountability but does not certify food safety.

### E. Visitor feedback

Open Already at a place / Check in. Use the same venue QR. Finish with the button and submit a private review; no exit QR is requested. Show the administrator's private review queue and uncertainty-aware analysis. Explain why the recorded interval is approximate and why reviews remain human-reviewed.

### F. Close with implementation evidence

Show the architecture diagram, relational schema/migrations and complete-flow report. Describe which actions were automated through UI and which used real APIs. Mention the roadmap priorities for a real pilot rather than presenting future controls as already complete.

## 4. Files to submit

| Deliverable | Location |
| --- | --- |
| Source and repository | Root application files and personal/team GitHub repository |
| Primary README | `README.md` |
| Role-by-role manual | `docs/USER_MANUAL.md` |
| Decision history | `docs/DECISIONS_AND_IMPROVEMENTS.md` |
| Architecture / API | `docs/ARCHITECTURE.md`, `API_CONTRACT.md` |
| Setup / operations | `START_HERE.md`, `docs/OPERATIONS.md` |
| Roadmap / boundaries | `docs/ROADMAP.md` |
| Test instructions | `docs/COMPLETE_FLOW_TEST.md` |
| License / attribution | `LICENSE`, `THIRD_PARTY_NOTICES.md` |
| Reproducible source ZIP | `releases/samrit-team.zip`, generated with `npm run share` |
| Optional local presentation data | Generated manual demo pack; share intentionally, separately from private data |

The source ZIP is not a database snapshot or a deployed application. A teammate installs dependencies, configures their own environment and seeds fresh local records. QR identifiers from one local database are not automatically valid on another installation.

## 5. Submission checklist

- [ ] Repository/ZIP includes shared types, migrations, public seed snapshot, scripts, documentation and required notices.
- [ ] No `.env`, real API key, sign-in token, private document, backup, database volume or installed dependency directory is included.
- [ ] README links and local setup commands resolve; demo account creation matches the documentation.
- [ ] `npm run build` and `npm test` pass.
- [ ] `npm run test:database` passes against the configured database service.
- [ ] API and browser smoke checks pass with current demo fixtures.
- [ ] Core complete-flow report passes and cleanup is successful.
- [ ] Strict live-AI run passes if the presentation claims live OCR/filtering/review analysis.
- [ ] Desktop/mobile and light/dark screenshots reflect the final cleaned UI.
- [ ] Physical phone camera/GPS checks have been completed or explicitly identified as pending.
- [ ] Printed manual QR codes refer to the intended current database and unused sticker.
- [ ] Demo meals/synthetic evidence remain clearly identified; no real partnership or live-availability claim is implied.
- [ ] Known launch limitations and required operator/legal review are disclosed in documentation.
- [ ] If publishing to GitHub, review the exact commit and latest check status before announcing submission readiness.

## 6. Common judge questions

**Why one venue QR?** It reduces venue signage and visitor effort. Permissions and context distinguish driver arrival from visitor check-in. Finishing in the app deliberately sacrifices an exit-location reading; timing is approximate.

**Why use Gemini?** It helps interpret natural-language preferences and extract document/review structure. Allergen exclusions, permissions, portion limits, assignment conflicts and custody order remain deterministic rules.

**How do you prevent made-up food information?** Outputs are schema-validated and unresolved values remain unknown. Staff confirm dishes before persistence as verified menus. That is an accountable review step, not an assertion that hallucinations are impossible.

**Is the database real?** Yes: PostgreSQL schemas, foreign keys, constraints, typed writes, migrations, public-data provenance and tested recovery. The original JSON records are retained only as a migration/recovery reference.

**Is it ready for public operation?** The submitted workflows are implemented and tested within their documented scope. Public launch still needs the P0 controls and partner procedures in the roadmap.
