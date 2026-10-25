# Samrit — presenter notes

## 01 · Samrit

Samrit brings together the everyday idea of a Good Samaritan—a person helping someone in need—and Amrit, from Sanskrit amṛta, nectar. Essence is our brand interpretation rather than a literal dictionary gloss. The Samaritan reference also evokes the Bill Emerson Good Samaritan Food Donation Act. We are not claiming that using Samrit automatically provides immunity: donation protections have conditions. Our promise is a welcoming route to food, supported by an accountable community.

## 02 · Steel & steam

The logistics interpretation of Steel and Steam is natural: vehicles, equipment and a chain of handoffs. Our twist is to start inside the kitchen. Steel is the physical and operational structure that makes a meal possible. Steam is the warm, human result. This is not a transport dashboard looking for a use case; it is a food-access experience with logistics behind it.

## 03 · Need and access

These figures describe different populations and should not be multiplied together. USDA reports 47.9 million people living in food-insecure U.S. households in 2024; this does not mean every person experienced hunger in the same way. EPA estimates 30–40% of the U.S. food supply goes uneaten. Food Bank For NYC describes a network of nearly 800 pantries, soup kitchens and mobile pantries; it is not a soup-kitchen-only census or a Samrit partner count. Pew’s 2026 survey found 80% smartphone ownership among adults in households earning under $30,000. That is a proxy for reach, not a food-insecurity-specific smartphone measure. Digital access still has gaps.

## 04 · Strict simplicity

The person looking for food should not have to understand the logistics system. Our landing page prioritizes finding a meal. A person can browse without an account, choose visible allergen chips, write preferences in everyday language, or use the optional assistant. Staff workspaces are focused on their own jobs. Accountability lives in role permissions, verified menus, stage-ordered handoffs and evidence records. Simplicity is the front door; accountability supports it behind the scenes. These are design goals, not a claim of a completed formal accessibility audit.

## 05 · Unique capabilities

The platform’s distinctive contribution is the combination: accessible discovery, human-verified menu extraction, accountable handoffs and private organizational learning. The AI is deliberately connected to concrete actions and structured records. It is not used as a replacement for food-handler judgment or as a public score that can shame a venue. The next slides show how these capabilities are distributed across the four faces.

## 06 · Four-face structure

We retain the original four-face structure. Face one is the public consumer experience; face two is the distribution center; face three is the event organizer or donor; and face four is the central NGO. The driver mobile view belongs to the NGO logistics face rather than becoming a fifth public signup category. The NGO already manages its people and fleet. Samrit coordinates those resources and records their handoffs.

## 07 · Consumer face

The person seeking a meal is the priority, not a side link inside a staff portal. The interface uses FDA-recognized major-allergen categories: milk, eggs, fish, Crustacean shellfish, tree nuts, peanuts, wheat, soybeans and sesame. Gemini can interpret a preference such as avoiding cold food, while unknown nutritional properties are not invented. People should still confirm ingredients and cross-contact with staff. The sourced NYC directory and fictional demo meal catalog are distinct; this is not a live promise of meal availability. One shared venue QR starts the visit, and a finish button opens private feedback without an exit scan.

## 08 · Distribution-center face

A center registers its facility, operating hours, equipment, seating, staffing and receiving capacity. Admin approval makes the center eligible for matching. Mixed batches require support for every included handling type. The driver scans the center’s shared venue code on arrival; center staff scan the tracking sticker and submit the receiving photograph. The same venue code supports consumer check-in, reducing signage and removing an unnecessary second entry code and exit code. A shared code does not merge delivery records with anonymous visit credentials.

## 09 · Donor and OCR

The donor can upload a menu or invoice for Gemini extraction. Dishes, ingredients, declared allergens, servings and handling requirements become editable candidates. The donor must confirm them; an invoice’s ingredients do not prove that a dish was served. After the event starts, the donor selects leftovers, enters positive whole-number servings, chooses all needed handling types and adds the Stage 1 photo. Clearing a servings field keeps its checkbox selected and blocks submission until corrected. Mixed handling is supported only when the assigned vehicle and destination can support every included requirement. The menu shown is a fictional test fixture.

## 10 · Central NGO and driver face

The central NGO uses its existing volunteer/driver operation and truck fleet. It provisions driver access, maintains equipment and availability, approves facilities and assigns resources. Vehicle capacity and every handling type must match the batch. A driver has one active assignment per resource, records pickup and arrival, and links a unique sticker to the batch. Center staff complete delivery. Map routes are planning visualizations, not live traffic optimization or continuous tracking. In presentation mode, distances and GPS verification are explicitly simulated so the demonstration works on a desktop.

## 11 · ElevenLabs and Gemini assistant

The assistant is an optional agentic layer, not a replacement for the existing interface. Stop recording to send automatically. ElevenLabs transcribes the audio; Gemini lightly corrects transcription errors while preserving intent and negation, then chooses a constrained page action. ElevenLabs speaks the result. A request to leave a review finishes the current visit and opens feedback; a ready review submits when explicitly requested, without repeated confirmation questions. Filters retain visible confirmation, permissions stay with the browser and unrelated requests receive a scoped refusal with available page actions. Audio and text go to their respective providers; keys remain server-side.

## 12 · QR, images and location evidence

Each valid handoff grows the custody record with a QR event, timestamp, actor and linked photo evidence. The workflow enforces stage order, event and destination identity, assigned-driver permissions, sticker uniqueness and center receipt. SHA-256 hashes identify the stored photo bytes; they do not prove the food is safe or make the whole database immutable. The accurate description is an append-style evidence trail rather than an independently tamper-proof append-only ledger. Live mode has proximity checks; the current desktop demo uses sample coordinates, skips proximity rejection and permanently marks location evidence simulated. AI uses this context for consistency review, not guaranteed fraud detection.

## 13 · Private feedback and review verification

Consumer and staff feedback is private to the central NGO. Gemini can identify concerns such as a long wait, packaging problems or temperature worries, summarize them and assess consistency with available evidence. This is review verification in the limited sense of evidence consistency, not proof that a statement is true or false. A long interval between check-in and pressing Finish is not a measured queue duration. Simulated location provides no attendance corroboration. Staff make the judgment and guide donors or venues. Visitor AI results do not automatically impose public ratings or penalties.

## 14 · Operational workflow and demonstration boundaries

The complete operational path has been exercised: register and approve a venue, confirm a donor event menu, create leftovers after the event starts, assign an eligible driver and vehicle, complete QR/photo handoffs and receive the food. The public visit and private review path also works. Be precise about the gap: delivered batches do not yet automatically publish live meal offers to Find a Meal. The public catalog uses fictional offers alongside a separate directory of sourced NYC locations. The current demo deliberately simulates geolocation. These are explicit prototype boundaries rather than claims of production availability or verified GPS.

## 15 · Sources and scope

Every source title on this slide is clickable. The statistics retain their original year, geography and denominator. The smartphone statistic is specifically a lower-income ownership measure; the kitchen-network count combines several provider types. The Sanskrit reference supports nectar; essence is the team’s interpretation. The Good Samaritan Act reference is inspiration and context, not a claim of blanket liability protection. The final statement is grounded in the international right to adequate food. Screenshots show the project itself, and the sample menu is fictional.

## 16 · Access to food is a basic human right

Close with the principle that unites the product: access to food is a basic human right. Samrit’s role is to make that access easier to navigate and the supporting operations easier to account for. The person seeking a meal comes first. A welcoming experience and a trustworthy organization belong together.

## Sources

[S1] [USDA ERS · Food security, 2024](https://www.ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/key-statistics-graphics) — 47.9 million people lived in food-insecure U.S. households in 2024.

[S2] [EPA · U.S. food loss and waste](https://www.epa.gov/sustainable-management-food/united-states-2030-food-loss-and-waste-reduction-goal) — An estimated 30–40% of the U.S. food supply is never eaten.

[S3] [Food Bank For NYC · Distribution](https://www.foodbanknyc.org/what-we-do/food-distribution/) — Nearly 800 pantries, soup kitchens and mobile pantries; a mixed network, not a soup-kitchen-only count.

[S4] [Pew Research Center · Mobile, 2026](https://www.pewresearch.org/internet/fact-sheet/mobile/) — 80% smartphone ownership among U.S. adults in households earning below $30,000; survey Jan. 30–June 18, 2026.

[S5] [FDA · Nine major food allergens](https://www.fda.gov/food/buy-store-serve-safe-food/food-allergies-what-you-need-know) — Major-allergen categories inform the interface; the platform is not FDA endorsed.

[S6] [USDA · Donating / Good Samaritan Act](https://www.usda.gov/about-food/food-safety/food-loss-and-waste/donating) — The Bill Emerson Good Samaritan Food Donation Act provides conditional protections for qualifying good-faith donations.

[S7] [Cambridge Dictionary · Good Samaritan](https://dictionary.cambridge.org/us/dictionary/english/good-samaritan) — A person who helps people in need; the name invokes this everyday meaning.

[S8] [A Practical Sanskrit Dictionary · amṛta](https://api.pageplace.de/preview/DT0400.9788120837737_A24265371/preview-9788120837737_A24265371.pdf) — Amrit derives from Sanskrit amṛta, including the sense nectar. Essence is the team’s brand interpretation.

[S9] [OHCHR / FAO · The Right to Food](https://www.ohchr.org/sites/default/files/Documents/Publications/FactSheet34en.pdf) — The right to adequate food is recognized in international human-rights instruments.