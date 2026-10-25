# GPS-free presentation mode

The local presentation enables `DEMO_LOCATION_MODE=true` in `backend/.env` and `VITE_DEMO_LOCATION_MODE=true` in `frontend/.env`. Templates default both to false. Use both flags together; restart the backend and restart/rebuild the frontend when changing them.

All existing location controls remain available. Donor pickup location, venue location, driver reports, photos, handoff scans, consumer location sorting and visitor check-in use sample New York City coordinates without requesting browser geolocation. Real maps and registered location markers remain visible. Device GPS is not needed on a desktop.

The server skips proximity rejection only in this explicit mode. Dispatch uses simulated distance of zero and a 15-minute handling estimate, and does not require a driver's device position. Drivers still must be available, vehicles ready, and vehicles/centers equipped for all food handling requirements. Capacity, expiry, facility approval/opening hours, QR identities, ownership, photo stages, tracking stickers and visit/review sequencing remain enforced.

New photo, custody-scan, driver-report and visitor-scan location records carry `location_source=simulated`. Existing records default to unspecified rather than being retroactively described as GPS verified. Route metadata records its simulated planning mode. Custody photo and private visitor review screens identify simulated evidence, and AI review analysis is instructed not to treat it as proof of attendance, distance, safety or trust.

Migration `006_demo_location_sources.sql` adds provenance fields without deleting prior records. `npm run db:migrate` applies it. Set both flags to false to restore real GPS and proximity checks; already simulated records retain their markers. This mode is for a presentation, not validation of real-world food custody.
