# Central NGO driver and fleet model

Public signup supports donors and distribution centers. Drivers retain the internal `VOLUNTEER` role for compatibility with existing accounts and custody permissions, but the public API rejects registration for that role. The central NGO provisions driver accounts from **Drivers & vehicles**, issues credentials privately, and manages availability and account activation. Passwords are hashed with bcrypt and are never returned by provisioning or overview APIs.

Vehicle records store a name, unique registration/fleet identifier, serving capacity, handling capabilities, equipment and operational status. The central NGO owns these records. Drivers see the assigned vehicle and equipment without editing controls. The old user-level transport fields are retained for historical compatibility but are no longer used for new dispatch decisions; self-service updates to them and availability are rejected.

Dispatch requires explicit driver and vehicle IDs. Both must be eligible and free of any active route. Vehicle capabilities must support the batch's handling requirement and capacity must cover its servings; the existing receiving-center hours, equipment, remaining capacity and expiry checks also apply. A transaction-wide PostgreSQL advisory lock serializes fleet edits, dispatch and custody updates, preventing overlapping assignments across API processes. Readiness and driver availability are independent from the derived "on route" state.

New routes include a vehicle ID and an assignment-time equipment/capacity snapshot. Historical routes without a vehicle ID remain readable and assigned drivers continue to have access. The UI flags the missing historical vehicle record rather than guessing a truck. Active vehicle records are locked against edits; busy drivers cannot be disabled. Completed or cancelled routes no longer reserve resources.

Before pickup, an admin may cancel a route with a reason. Uncollected matched batches return to pending and release the center, driver and vehicle. Cancellation is blocked after any pickup photo or in-transit state; use the existing custody/quality-hold workflow in those cases. Quality rejection retains its existing audit record and cancels the associated route.

The route map shows pickup/drop-off stops, straight-line route connections, stop completion counts and driver positions. Driver reports and custody scans record a timestamp. Admin-provisioned base locations are explicitly labeled as bases, not current GPS. Drivers can explicitly report current GPS from their portal. This is not continuous/live tracking or road-network routing.

Admin endpoints: `POST /api/fleet/drivers`, `PATCH /api/fleet/drivers/:id`, `POST /api/fleet/vehicles`, `PUT /api/fleet/vehicles/:id`, `PATCH /api/logistics/routes/:id/cancel`. Driver location: `POST /api/fleet/location`. All require authenticated, active users with the appropriate role.

For localhost demo data, run `node scripts/seed-fleet.cjs`. This adds two provisioned drivers and three equipped vehicles without clearing existing users or routes. Add `--with-route` to create one explicitly synthetic active hot-meal route when the demo driver and truck are free. Demo driver logins: `driver.maya@example.com` and `driver.jordan@example.com`, password `DemoDriver123!`. These are synthetic local demo credentials, not production credentials.
