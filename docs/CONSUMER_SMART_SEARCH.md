# Meal preference search and NYC map

The public `/consumer` page uses fictional sample providers and meals, not live availability. The seed descriptions originate in `shared/types/consumer-meals.ts`; active catalog reads use PostgreSQL through the evidence/catalog service.

The visitor enters a note and selects **Find meals for my preferences** (or presses Enter). The browser sends only the note and selected allergens to `POST /api/consumer/search`. The server supplies the sample meal metadata to Gemini, validates one decision for every eligible meal ID, and rejects missing, duplicate or invented IDs. Selected allergens are excluded deterministically before calling Gemini; model output cannot restore an excluded meal.

Only supported matches are shown. Unknown suitability, including unverified sodium information, is hidden with an explanation rather than presented as a recommendation. This is a preference aid, not a medical recommendation or allergen-safety certification.

Configure these variables in the ignored backend environment and restart the API:

```dotenv
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-flash-lite-latest
```

No key belongs in a frontend `VITE_*` variable. Missing keys/provider failures are shown without claiming that notes were applied. Explicit submission avoids sending every keystroke; bounded input, per-IP request limits, concurrency limits, timeouts reduce unnecessary calls. Raw notes are not stored as AI job inputs; validated results and input hashes are audited. Review your provider's data policies before public rollout.

The map is a real Leaflet/OpenStreetMap street map. The meal map uses the filtered fictional locations; the separate directory map uses publicly listed NYC facilities. OpenStreetMap attribution is visible; tile loading requires an internet connection and failure displays a fallback notice. See https://operations.osmfoundation.org/policies/tiles/ before production-scale usage. No geolocation is requested for browsing this map.

Test provider responses are mocked to verify matching, allergen exclusions, unknown results, invalid output and missing configuration. Live Gemini behavior requires a real key and must be verified separately.
