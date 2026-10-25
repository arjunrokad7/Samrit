# Samrit

## Platform User Manual

**Food access and accountable surplus-food recovery**

**Edition:** Final submission  
**Operating region:** New York City, United States  
**Time zone:** America/New_York  
**For:** People finding food, donors, distribution centers, NGO drivers and central administrators

[Download the print-ready PDF](USER_MANUAL.pdf) · [Open the formatted HTML edition](USER_MANUAL.html)

The PDF and HTML editions include a title page, numbered contents, chapter page breaks and tables kept together. This Markdown file is the editable source.

---

## Table of contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Common controls and conventions](#2-common-controls-and-conventions)
3. [People finding food](#3-people-finding-food)
4. [Donors and event organizers](#4-donors-and-event-organizers)
5. [Distribution-center staff](#5-distribution-center-staff)
6. [NGO-managed drivers](#6-ngo-managed-drivers)
7. [Central NGO administrators](#7-central-ngo-administrators)
8. [Troubleshooting](#8-troubleshooting)
9. [Operating boundaries and references](#9-operating-boundaries-and-references)

---

## 1. Purpose and scope

Samrit coordinates surplus-food recovery and provides a dignified public entry point for people seeking meals. This manual covers the final submission's actual screens and workflows. It is a software operating guide, not food-handler training, a food-safety certificate or legal advice.

The public site and the operational network are related but distinct. A publicly listed food pantry is not automatically an approved receiving center. A delivered batch is not automatically a public meal listing. A visitor review is not a public rating. These distinctions prevent the demo from implying partnerships, availability or safety guarantees that have not been established.

### Audiences and access

| Person | Access | Primary responsibility |
| --- | --- | --- |
| Person finding food | Public; no registration | Explore resources, communicate preferences, check in and optionally review |
| Donor / event organizer | `DONOR` account | Confirm menu information, offer leftovers and record initial evidence |
| Distribution-center staff | `NGO` account | Maintain facility capabilities, receive deliveries and provide handoff feedback |
| NGO-managed driver | `VOLUNTEER` internal role | Complete assigned pickup/delivery steps using the NGO's assigned vehicle |
| Central NGO administrator | `ADMIN` account | Approve centers, manage people/vehicles, dispatch resources and review quality records |

The internal `VOLUNTEER` role name is retained for compatibility. In the product it means an NGO-managed driver, not a person who signs up publicly. The central NGO is assumed to already have its own volunteer/staff management arrangements and vehicles.

## 2. Common controls and conventions

### Opening the application

For the local demonstration, open `http://localhost:5173`. Use **Find a meal** for the public experience or **Sign in** for an operational workspace. **Be a part of the solution** leads to donor/center registration. Mobile navigation may collapse into a menu.

An operational workspace has an overview, role-specific navigation and a Refresh control. Refresh retrieves the current server state; periodic refresh also updates the workspace. A lost connection can leave the last displayed information stale. Confirm that a submitted action produces a success message before continuing to the next custody step.

### Theme and layout

Use the moon/sun control at the bottom-right to switch light/dark appearance. Without a saved choice, the platform follows the device's preference. A saved choice survives page changes and reloads and synchronizes between tabs. On small screens the button is icon-only with an accessible label.

The page scrollbar is visually hidden, but wheel, touch and keyboard scrolling remain enabled. Scrollable tables, lists and dialogs may retain their own scrollbars. The visitor check-in footer rests at the bottom on short pages and follows longer content.

### Time, distances and quantities

- The default operating region is New York City, United States.
- Event times are entered/displayed in Eastern time using `America/New_York`, including daylight-saving changes. Stored timestamps are time-zone-aware/UTC representations.
- Distances are in miles. Currency examples use USD. Temperature presentation uses Fahrenheit where temperature information is shown.
- Capacity and allocation are expressed in estimated servings. They are planning counts, not measured food weights or guaranteed meals served.
- Hot, refrigerated, frozen and shelf-stable are distinct handling categories. Equipment compatibility is checked independently of the food's name.

### Photos, codes and location permissions

Custody photo inputs accept JPEG, PNG and WebP up to 5 MB. Menu/invoice extraction also accepts PDFs up to 5 MB. Use clear, relevant images; synthetic pictures supplied with the demo are only test placeholders.

Camera access normally requires HTTPS or localhost. A phone opening a developer computer's plain HTTP LAN address may not be allowed to use its camera. If the camera is unavailable, enter the exact printed QR value in the scan field. This fallback does not bypass the server's workflow or ownership checks.

Delivery custody requires device coordinates near the registered pickup/center, using the configured proximity threshold. Allow location permission and be at the appropriate point. Visitor arrival location is optional. A typed address is not automatically geocoded; operational users must keep coordinates and addresses consistent. Donors can use **Use my current location**; center/admin forms retain explicit location configuration.

For remote demonstrations only, browser developer tools can simulate the registered coordinates. Real use must never substitute a test location for an actual handoff.

### Accounts

Donors and centers can register through the public form. Drivers receive issued credentials from their NGO. The initial administrator is created from server configuration, not public registration. All operational actions require an active account with the appropriate role.

Demo credentials are in the root README and submission guide. Real deployments should disable or remove demo accounts, replace all example credentials and implement proper credential recovery before a pilot. This version does not provide a complete self-service password-reset or multifactor-authentication flow.

## 3. People finding food

### 3.1 Find a meal

1. Open **Find a meal** from the landing page. No sign-in is required.
2. Read the demo indicator: current sample meal cards are fictional and do not indicate live availability.
3. Open **Select your allergens**. Search the list if necessary and choose the allergens you need to avoid.
4. Clicking an allergen row or its checkbox toggles selection. Selected chips appear inside the main field. Remove a chip with its cross; clicking the chip text alone does not remove it.
5. Review the remaining sample cards and map markers.

The nine supported major-allergen labels follow the [FDA major-allergen reference](https://www.fda.gov/food/buy-store-serve-safe-food/food-allergies-what-you-need-know): Milk, Eggs, Fish, Crustacean shellfish, Tree nuts, Peanuts, Wheat, Soybeans and Sesame. Declared matching allergens exclude a meal deterministically. Missing or empty allergen declarations do not establish an allergen-free meal. Confirm ingredients and cross-contact risks directly with staff.

### 3.2 Add a natural-language preference

Enter a note in **Any other preferences or dietary restrictions?**, then select **Find meals for my preferences** or press Enter. Examples include:

- “I cannot eat cold food.”
- “I prefer vegan food.”
- “I prefer lower sodium meals.”

Gemini receives the note and server-provided meal descriptions, serving temperatures and dietary tags. Do not include names or personal medical details. The service returns a supported match, a conflict or an unknown decision for each eligible meal. Only supported matches are presented as matches. Unverified sodium information cannot justify a low-sodium claim.

If the provider is unavailable or its response fails validation, the screen reports that the note was not applied. The deterministic allergen exclusions still work. **Clear preferences** removes the note-based result. This feature is a search aid, not medical advice or a food-safety assessment.

### 3.3 Browse real NYC assistance locations

Expand the NYC food-assistance directory. Listings include provider names, addresses, service categories, source links and retrieval information, with a separate map. The submission's accepted import contains 59 records across all five boroughs.

These are publicly listed facilities, not verified Samrit partners. Contact the provider to confirm opening hours, eligibility and current service. The platform does not invent meal menus, open hours or stock levels for them. Preference filters for the fictional meal cards do not confirm suitability at real directory locations.

Maps require connectivity to the tile provider. If tiles fail, the address and directions link remain useful. A directions link opens a map service; the prototype does not reserve a meal or provide transport.

### 3.4 Already at a place: check in

1. Open **Check in here** near the top of the meal finder or **Already at a place? Check in** near the bottom.
2. Scan the venue's **Venue check-in QR** or enter its printed code.
3. Allow arrival location if comfortable; declining it does not prevent the visit review.
4. Select **Check in** if entering a printed value. The screen confirms the recorded arrival.
5. Keep the page open until the visit is finished. Visit credentials stay in browser memory; reloading currently requires starting a new visit.

The same venue QR is used by delivery drivers and meal visitors. The application's current flow determines which operation it records. A visitor scan creates a visit; it never completes a food delivery. Only approved operational centers' shared codes or seeded fictional demo codes participate in this workflow. An imported public-directory record alone does not provide a Samrit check-in code.

### 3.5 Finish and leave private feedback

1. After the meal or when leaving, select **Finish visit and leave a review**.
2. Select **Good experience** or **Needs attention**.
3. Add optional details. A visitor who did not receive food can still review the experience.
4. Select **Submit private review** and wait for confirmation.

There is **no exit QR and no exit GPS reading** in the current flow. The Finish button records server time. The elapsed time is approximate time until that button press, not verified departure time or proven queue duration. For example, a 45-minute recorded interval and a complaint about waiting can be considered together, but neither proves the complaint true or false.

Feedback is restricted to the central NGO. No name or account is required, but precise arrival location and timestamps can still identify a visit. Gemini receives the review and evidence context for consistency analysis. Human review is required, and the application does not publish consumer ratings or issue automatic penalties based on visit analysis. One review is accepted per completed visit; duplicate submissions are rejected.

## 4. Donors and event organizers

### 4.1 Set up an event

Sign in as a donor and open **Event planning**. Enter an event name, scheduled time and pickup address. Use **Use my current location** when at the real pickup location. Latitude/longitude fields were removed from the donor UI, but coordinates remain necessary internally for maps and custody checks.

Do not assume that editing the address changes its coordinates. The current prototype has no general address-search/geocoding service. For a real pickup, the address and recorded position must describe the same place. If they cannot be made accurate through the current location action, coordinate with the NGO rather than pretending the configured NYC defaults are the actual location.

### 4.2 Extract a menu or invoice

Choose **Menu** or **Invoice**, select a supported image/PDF, and select **Extract menu with AI**. The original document is stored in the private document area and sent to Gemini. If extraction cannot complete, manual entry remains available and a failed extraction record is retained.

Candidates are editable and unverified. Review the document yourself. In particular:

- A quantity of ingredients on an invoice does not prove a prepared dish was served.
- Supplied portions do not establish the number of leftover portions.
- Unstated allergens, ingredients, handling and servings must not be treated as known facts.
- An attractive food photo or an OCR result is not evidence that food remained safe.

Confirm the dish name, ingredients, declared allergens, actual handling category and estimated servings. Use miscellaneous food notes for packaging or portion details that do not fit a core field. Core quantities, ownership, handling and allergen labels remain structured fields; notes cannot override them.

Verify each dish before saving. The API rejects unverified menu items. Confirmation links an extracted candidate to a confirmed menu item and records the staff account responsible. The seeded/test workflow marks its synthetic confirmations explicitly; a real person must make the confirmation in real operation.

### 4.3 Manual menus

Use **Add another dish** to enter additional items. Set each dish's ingredients, allergens, servings and handling requirement. Unknown handling must be resolved before saving. Remove unneeded draft dishes rather than marking an unreviewed candidate as verified.

When an event saves successfully, it appears in the saved-event list with its pickup QR. The form clears the prior document associations for the next event. This version does not provide a complete edit/version/reissue workflow for an already confirmed event menu; corrections after save need an operator-approved process.

### 4.4 Triage leftovers

Open **Leftover triage** after the event's scheduled time. Choose the correct saved event, select dishes that remain, and enter the remaining servings. For example, a confirmed 30-serving soup may have 10 servings remaining; record 10, not the original 30.

Create separate batches for different handling requirements. A hot dish and a refrigerated dish cannot share a single handling claim. Across all created batches, allocated leftover servings cannot exceed the event's confirmed servings. The server also rejects unknown dishes or altered core menu details supplied as if they belonged to the event.

Select a future **Use by** time in Eastern time. Capture/upload the **Stage 1 donor food photo** while at the pickup point and allow location access. Select **Create rescue batch**. An accepted batch starts pending and becomes available to central dispatch.

The deadline is entered by responsible staff, not calculated as a food-safety certification. Keep accurate preparation/storage records and follow the operator's safe-handling procedures. Never extend an expiry merely to make a delivery match succeed.

### 4.5 Handoff to the driver

Display the event pickup QR associated with that batch. It is distinct from the receiving venue's shared QR. The assigned driver records the pickup scan and their own Stage 2 photo, then links an unused physical container sticker. Do not substitute a different event's QR or reuse an already bound sticker.

Use **Overview** and **Chain of custody** to review the status and evidence available to your role. Donors cannot approve centers, dispatch drivers, finalize receiving-center intake or inspect central NGO private review queues.

## 5. Distribution-center staff

### 5.1 Maintain My facility

Open **My facility** and provide:

- Facility name and correct address/coordinates.
- Time zone and operating hours, including overnight hours where applicable.
- Refrigeration, hot holding and freezer capabilities.
- Maximum serving capacity, seating and staffing.

Capabilities reflect what the facility can actually support. Refrigeration and freezing are not interchangeable. Opening hours must cover projected arrival, not merely the time a dispatcher presses Match. Center approval is a central NGO action; self-registration alone does not establish readiness or partnership.

Capacity is a software planning limit. It does not independently inspect equipment, assess licensing or measure available storage. Keep facility data current and communicate temporary closures or equipment failures to dispatch. A richer per-service exception calendar exists in the data model but is not a complete staff-facing scheduling system in this submission.

### 5.2 Display the shared venue QR

The facility page displays one **Venue check-in QR**. Print it or show it at the entrance. It serves two purposes:

| Scanner | In-app workflow | Recorded result |
| --- | --- | --- |
| Assigned driver | Delivery arrival | Custody arrival scan against the assigned batch and center |
| Meal visitor | Public check-in | Private visit arrival, with optional location |

No visitor QR pair needs to be generated. No exit QR is printed. The earlier pair-generation route is retained only as a compatibility route returning the current shared entry code; the current UI shows one venue QR.

Static codes are not proof of identity or presence by themselves. Drivers remain subject to assignment and GPS checks. Visitor evidence is interpreted with its limitations. If a printed code is damaged, reproduce the current code from the facility page; do not improvise an arbitrary value.

### 5.3 Receive food

Open **Intake & feedback**. Locate the assigned batch. The driver must already have completed the event scan, pickup photo, container link and correct venue-arrival scan.

1. Inspect the food and packaging under the center's real procedures.
2. Scan/enter the container sticker attached to this batch.
3. Take or upload the Stage 3 arrival photo.
4. Allow device location at the center and confirm intake.

Only the receiving center's account can finalize this stage. A driver cannot self-certify completion. A different sticker, missing arrival scan, reused proof or wrong location will be rejected. Completion saves the third custody proof, marks the delivery complete and releases active route reservations when all its stops are done.

If food appears unsafe or records do not match, stop intake and contact the NGO. Do not click through to obtain a green status. The administrator's quality-hold/rejection controls preserve a reason; they are not a substitute for physical isolation, disposal decisions or incident response.

### 5.4 Handoff feedback

After receipt, use **Private handoff feedback** for the delivered batch. Select the appropriate target/sentiment and provide relevant food-condition, packaging, temperature or venue details. This is different from a meal visitor's experience review.

The record is private to central NGO moderation. Other donors, drivers and public meal seekers do not receive the review queue or AI flags. Describe observations without unnecessary personal identifiers. This version does not provide a public center-rating page.

## 6. NGO-managed drivers

### 6.1 Before a route

Obtain credentials from the central NGO. Public registration offers donor/center categories only. After signing in, open **My handoffs**. Review the NGO-assigned vehicle, registration, serving capacity, handling capabilities and equipment.

The NGO controls driver availability and fleet inventory. Drivers do not declare their own truck equipment or make themselves available through a profile patch. If the shown vehicle is incorrect or not fit for the load, contact dispatch before pickup.

Use **Report current GPS** when ready. This is an explicit report, not continuous background tracking. Maps show the last report and its timestamp; an administrator-entered dispatch base is not current GPS. Keep dispatch informed if a trip cannot start.

### 6.2 Pickup sequence

For an assigned batch:

1. Travel to the pickup location. Treat distance/time as a planning estimate, not live traffic guidance.
2. Scan the event QR and select **Record event scan + GPS**.
3. Add the Stage 2 pickup photo.
4. Scan an unused container sticker and select **Link sticker & start delivery**.

The order matters. The API rejects a pickup photo before the event scan and rejects sticker binding before the pickup photo. A linked sticker is permanent for that batch and cannot be replaced casually or reused for another donation.

The batch then moves into the in-transit stage. Food handling remains a human responsibility: required equipment must actually be present and functioning, and the load must remain within the agreed operating procedures.

### 6.3 Delivery sequence

At the receiving center, scan the **same venue check-in QR** used by arriving meal visitors. Select the delivery-arrival action in the driver workspace. The backend checks the expected center and device proximity.

The center's staff completes Stage 3 using the container sticker and arrival photo. Do not confuse arrival with a completed intake. If staff cannot receive the load, contact dispatch rather than recording a false completion. Route updates and resource release follow the accepted server workflow.

Historical routes created before fleet allocation may not have a vehicle record. The application preserves them rather than inventing a truck. Confirm the actual vehicle with dispatch before treating historical information as a current assignment.

## 7. Central NGO administrators

### 7.1 Review the network

Use **Overview** for batch/serving counts and current network state. Metrics describe recorded activity; a delivered-serving count is not independently verified consumption or measured social impact. Refresh before assigning resources if the screen has been open for a while.

The central organization owns operations in this prototype. The design is not yet a fully isolated multi-NGO tenancy service. Do not onboard unrelated organizations into the same administrative scope without a tenancy/access review.

### 7.2 Approve centers

Open **Distribution centers**, review the submitted capabilities, hours and capacity, and approve a center only after the NGO's actual verification. An approval flag is an operator action, not an automated permit check. Imported directory locations do not become approved centers through an import.

### 7.3 Provision drivers

Open **Drivers & vehicles**, then **Provision driver**. Enter the person's name, email, issued password, contact details, availability and dispatch base. Issued passwords need at least 10 characters in this flow. Communicate credentials privately; the system stores password hashes and does not expose the original password through the fleet response.

A base location supports planning; it is not a live position. Drivers can report current GPS from their own workspace. An inactive account cannot operate through the API. Busy drivers cannot be disabled while an active route reserves them; resolve the assignment under the correct workflow first.

There is no full integration with an external volunteer-management database in the submission. The operating assumption is that the NGO already manages recruitment, training, scheduling, insurance and authorization outside Samrit.

### 7.4 Manage vehicles and equipment

Create or edit a vehicle with a name, unique registration, serving capacity, compatible handling categories, equipment list and readiness status. Available statuses include ready, maintenance and inactive. A ready truck can still be unavailable for a new assignment if an active route reserves it.

Equipment descriptions complement structured handling capabilities. A free-text note saying “freezer” does not replace the structured frozen capability. Do not increase a capacity value to work around an unsafe load. Vehicles on active routes are locked against editing, so assignment-time facts cannot quietly change during a trip.

### 7.5 Dispatch a batch

Open **Dispatch & routes**. Pending batches are presented with use-by information. Select an available driver and a ready compatible vehicle, then match the batch.

The backend selects an eligible center; this is not a manual center-picker or a Gemini-generated route. It checks approval, equipment, capacity reservations, operating hours/current and projected arrival, expiry feasibility and resource availability. The chosen driver needs a recorded location. Route scoring uses geographic/planning heuristics, and current handoff feedback can influence center ranking; review the architecture's fairness limitation before production use.

The matching transaction and database uniqueness constraints prevent overlapping active allocations. If the API says a resource is busy, refresh and choose another resource. A stale browser selection does not override the server.

### 7.6 Monitor, cancel or reject

Maps show ordered stops and straight-line connections. They do not calculate road restrictions, loading-zone access, congestion or truck-specific navigation. Reported driver points have timestamps and sources; do not treat an old report as continuous tracking.

A route may be cancelled with a reason before pickup evidence exists. Uncollected matched batches return to pending and reservations are released. After collection, cancellation is blocked; coordinate the custody/quality process instead of erasing an in-progress handoff.

Administrative rejection requires a reason and preserves the record. It can cancel the associated active route; it does not pretend that the rejected food was delivered. A completed delivery cannot be reversed through the rejection shortcut. Physical incident handling remains the NGO's responsibility.

### 7.7 Review quality records

**Private quality reviews** contains visitor reviews and receiving-center handoff feedback. Read the raw observations alongside the evidence and Gemini's summary, flags, consistency category and uncertainties. Missing evidence should remain missing, not be filled by assumption.

Mark a visitor review as reviewed only after a staff decision. The current action records that review occurred; it is not a full case-management system with appeals, escalations or an investigation outcome. Access is restricted to administrators. Visitor AI analysis does not itself issue sanctions. Handoff-feedback-based center ranking is a separate existing heuristic and should be assessed for bias and evidence quality.

## 8. Troubleshooting

| Symptom | What to check |
| --- | --- |
| Cannot sign in | Correct category/account, active status, current issued credentials, API connectivity |
| Driver cannot register | Expected: driver access is provisioned by the central NGO |
| Menu extraction unavailable | Server key/model, network and provider access; use manual entry |
| Extracted dish cannot save | Name, ingredients/allergens, positive servings, handling selection and explicit verification |
| Leftovers rejected | Event ownership/time, confirmed menu identity, total remaining servings, handling group, expiry and new Stage 1 proof |
| No matching route | Approved/open compatible center, remaining capacity, ready compatible truck, available unassigned driver, recorded position and expiry feasibility |
| GPS rejected | Site permission, actual registered location, browser/device accuracy, configured threshold; address text alone does not move GPS |
| Wrong QR | Event code for pickup, venue code for arrival, container sticker for intake; use the value associated with this batch |
| Camera unavailable | HTTPS/localhost, permissions and device selection; enter the printed code |
| Finish/review rejected | Keep the original visit page open, check in first, finish with its visit credentials, submit once |
| Review appears delayed | Provider timeout/manual fallback; check the central queue and refresh |
| Too many requests | Wait through the per-IP cooldown; avoid rapid repeated submissions |
| Map tiles absent | Connectivity/tile provider; use visible address and directions link |
| State did not advance | Look for the actual error, refresh and inspect evidence; do not assume a button click succeeded |

## 9. Operating boundaries and references

Do not use demo meals as real service promises or test photos as real evidence. Do not place server API keys in browser configuration or publish private backups. Public claims about safety, availability, location tracking and AI must match the implemented behavior.

The platform exposes draft terms and regulations pages. Applicable rules depend on the operation and circumstances. For authoritative references, consult [New York Agriculture & Markets Law §71-z](https://www.nysenate.gov/legislation/laws/AGM/71-Z), [New York State food-service regulations](https://www.health.ny.gov/environmental/indoors/food_safety/regs.htm) and the relevant local health department. The manual intentionally does not prescribe cooking, cooling, transport-temperature or legal-immunity rules.

For setup, deployment, storage, privacy and recovery procedures, continue to [Operations](OPERATIONS.md). For a future public pilot, use the [Roadmap](ROADMAP.md) as a decision checklist, not as a claim that those controls already exist.
