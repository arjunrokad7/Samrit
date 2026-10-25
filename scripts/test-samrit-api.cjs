const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Client } = require("../backend/node_modules/pg");
const {
  call,
  login,
  photo,
  pickup,
  destination,
} = require("./seed-samrit.cjs");
const run = randomUUID().slice(0, 8);
const ids = [];
const fleetIds = [];
let checks = 0;
async function expectStatus(endpoint, method, body, token, status) {
  await call(endpoint, method, body, token, status);
  checks++;
}
async function register(role) {
  const email = `samrit-test-${run}-${role.toLowerCase()}@example.com`;
  const account = await call("/auth/register", "POST", {
    email,
    password: "TestOnly123!",
    name: `Test ${run} ${role}`,
    role,
  });
  ids.push(account.user.id);
  return account;
}
async function main() {
  try {
    await expectStatus(
      "/auth/register",
      "POST",
      {
        email: `samrit-test-${run}@example.com`,
        password: "TestOnly123!",
        name: "Unauthorized admin",
        role: "ADMIN",
      },
      undefined,
      400,
    );
    const donor = await register("DONOR");
    const centerUser = await register("NGO");
    const admin = await login(
      process.env.SUPER_ADMIN_EMAIL || "admin@samrit.local",
      process.env.SUPER_ADMIN_PASSWORD || "SecureAdmin123!",
    );
    await expectStatus('/auth/register', 'POST', { email: `samrit-test-${run}-blocked@example.com`, password: 'TestOnly123!', name: 'Uninvited driver', role: 'VOLUNTEER' }, undefined, 400);
    const provisioned = await call('/api/fleet/drivers', 'POST', { email: `samrit-test-${run}-driver@example.com`, password: 'TestOnly123!', name: `Test ${run} driver`, isAvailable: true, location: pickup }, admin.token);
    ids.push(provisioned.id);
    const driver = await login(`samrit-test-${run}-driver@example.com`, 'TestOnly123!');
    const vehicle = await call('/api/fleet/vehicles', 'POST', { name: `Test ${run} truck`, registration: `TEST-${run}`, capacityServings: 100, capabilities: ['shelf_stable'], equipment: [], status: 'ready' }, admin.token);
    fleetIds.push(vehicle.vehicleId);
    await expectStatus('/api/fleet/vehicles', 'POST', { name: 'Unauthorized', registration: `DENY-${run}`, capacityServings: 100, capabilities: ['hot'], equipment: [], status: 'ready' }, donor.token, 403);
    await expectStatus(
      "/api/samrit/overview",
      "GET",
      undefined,
      undefined,
      401,
    );
    const location = { ...destination, lat: 40.784, lng: -73.95 };
    const eventLocation = { ...pickup, lat: 40.7841, lng: -73.9501 };
    const gps = { lat: eventLocation.lat, lng: eventLocation.lng };
    const center = await call(
      "/api/centers/profile",
      "PUT",
      {
        name: `Test ${run} Kitchen`,
        location,
        timeZone: "America/New_York",
        capabilities: {
          refrigeration: true,
          hotHolding: true,
          freezer: true,
          maxMealCapacity: 100,
        },
        operatingHours: { open: "00:00", close: "23:59" },
        seating: 10,
        staffing: 2,
      },
      centerUser.token,
    );
    await expectStatus(
      `/api/centers/${center.centerId}/approve`,
      "PATCH",
      {},
      donor.token,
      403,
    );
    await call(
      `/api/centers/${center.centerId}/approve`,
      "PATCH",
      {},
      admin.token,
    );
    const item = {
      name: `Test ${run} Soup`,
      ingredients: ["Carrot"],
      allergens: [],
      estimatedServings: 10,
      handlingRequirement: "hot",
      verified: true,
    };
    const event = await call(
      "/api/events",
      "POST",
      {
        name: `Test ${run} Event`,
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
        location: eventLocation,
        items: [{...item,estimatedServings:20}],
        notes: "Integration test fixture",
      },
      donor.token,
    );
    const evidence = await photo(1, eventLocation, donor.token);
    const input = {
      donorEventId: event.eventId,
      items: [item],
      handlingRequirement: "hot",
      expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      photoId: evidence.photoId,
    };
    await expectStatus(
      "/api/batches",
      "POST",
      { ...input, status: "delivered" },
      donor.token,
      400,
    );
    const batch = await call("/api/batches", "POST", input, donor.token);
    await expectStatus("/api/batches", "POST", input, donor.token, 400); // No proof reuse.
    await expectStatus(
      "/api/logistics/match",
      "POST",
      { batchId: batch.batchId, driverId: driver.user.id, vehicleId: vehicle.vehicleId },
      donor.token,
      403,
    );
    await expectStatus('/auth/profile', 'PATCH', { isAvailable: true }, driver.token, 403);
    await expectStatus(
      "/api/logistics/match",
      "POST",
      { batchId: batch.batchId, driverId: driver.user.id, vehicleId: vehicle.vehicleId },
      admin.token,
      400,
    ); // No hot transport.
    await expectStatus('/auth/profile', 'PATCH', { transportCapabilities: ['hot'] }, driver.token, 403);
    await call(`/api/fleet/vehicles/${vehicle.vehicleId}`, 'PUT', { name: `Test ${run} truck`, registration: `TEST-${run}`, capacityServings: 100, capabilities: ['shelf_stable','hot'], equipment: ['Hot holding boxes'], status: 'ready' }, admin.token);
    await call('/api/fleet/location', 'POST', gps, driver.token);
    const matches = await Promise.all(
      [1, 2].map(() =>
        fetch("http://localhost:3000/api/logistics/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          body: JSON.stringify({
            batchId: batch.batchId,
            driverId: driver.user.id,
            vehicleId: vehicle.vehicleId,
          }),
        }),
      ),
    );
    assert.deepEqual(
      matches.map((response) => response.status).sort(),
      [200, 409],
    );
    checks++;
    const assignedOverview = await call('/api/samrit/overview', 'GET', undefined, admin.token);
    const assignedRoute = assignedOverview.routes.find(route => route.assignedBatches.includes(batch.batchId));
    assert.equal(assignedRoute.vehicleId, vehicle.vehicleId); checks++;
    const secondEvidence = await photo(1, eventLocation, donor.token);
    const secondBatch = await call('/api/batches', 'POST', { ...input, photoId: secondEvidence.photoId }, donor.token);
    await expectStatus('/api/logistics/match', 'POST', { batchId: secondBatch.batchId, driverId: driver.user.id, vehicleId: vehicle.vehicleId }, admin.token, 409);
    await expectStatus(`/api/fleet/vehicles/${vehicle.vehicleId}`, 'PUT', { name: `Test ${run} truck`, registration: `TEST-${run}`, capacityServings: 100, capabilities: ['hot'], equipment: [], status: 'maintenance' }, admin.token, 409);
    await expectStatus(`/api/fleet/drivers/${driver.user.id}`, 'PATCH', { isActive: false }, admin.token, 409);
    await assert.rejects(
      photo(2, eventLocation, driver.token, batch.batchId),
      /Scan the event QR first/,
    );
    checks++;
    await expectStatus(
      "/api/logistics/scan",
      "POST",
      {
        batchId: batch.batchId,
        kind: "event",
        value: `SAMRIT:EVENT:${event.eventId}`,
        lat: 0,
        lng: 0,
      },
      driver.token,
      400,
    );
    await expectStatus(
      "/api/logistics/scan",
      "POST",
      { batchId: batch.batchId, kind: "event", value: "WRONG-EVENT", ...gps },
      driver.token,
      400,
    );
    await call(
      "/api/logistics/scan",
      "POST",
      {
        batchId: batch.batchId,
        kind: "event",
        value: `SAMRIT:EVENT:${event.eventId}`,
        ...gps,
      },
      driver.token,
    );
    await photo(2, eventLocation, driver.token, batch.batchId);
    const sticker = `TEST-${run}`;
    await call(
      "/api/logistics/link-qr",
      "POST",
      { batchId: batch.batchId, qrStickerId: sticker, ...gps },
      driver.token,
    );
    await expectStatus(
      "/api/logistics/link-qr",
      "POST",
      { batchId: batch.batchId, qrStickerId: "REPLACEMENT", ...gps },
      driver.token,
      400,
    );
    await assert.rejects(
      photo(3, location, driver.token, batch.batchId, sticker),
      /Your role cannot/,
    );
    checks++;
    await assert.rejects(
      photo(3, location, centerUser.token, batch.batchId, sticker),
      /driver must scan/,
    );
    checks++;
    await call(
      "/api/logistics/scan",
      "POST",
      {
        batchId: batch.batchId,
        kind: "center",
        value: center.locationQrCode,
        lat: location.lat,
        lng: location.lng,
      },
      driver.token,
    );
    await assert.rejects(
      photo(3, location, centerUser.token, batch.batchId, "WRONG-STICKER"),
      /tracking sticker/,
    );
    checks++;
    const delivered = await photo(
      3,
      location,
      centerUser.token,
      batch.batchId,
      sticker,
    );
    assert.equal(delivered.status, "delivered");
    assert.ok(delivered.chainOfCustody.stage3_DropoffPic.sha256);
    checks++;
    await call(
      "/api/reviews/process",
      "POST",
      {
        targetType: "donor",
        targetId: donor.user.id,
        linkedBatchId: batch.batchId,
        sentiment: "negative",
        rawText:
          "Test review: packaging was leaking and the food smelled spoiled.",
      },
      centerUser.token,
    );
    for (const account of [donor, centerUser, driver]) {
      const overview = await call(
        "/api/samrit/overview",
        "GET",
        undefined,
        account.token,
      );
      const profile = await call('/auth/profile', 'GET', undefined, account.token);
      assert.equal('trustScore' in profile, false); checks++;
      assert.deepEqual(overview.reviews, []);
      checks++;
      assert.ok(
        !overview.batches.some((other) => other.donorId !== donor.user.id),
      );
      checks++;
    }
    const central = await call(
      "/api/samrit/overview",
      "GET",
      undefined,
      admin.token,
    );
    assert.ok(
      central.reviews.some(
        (review) =>
          review.linkedBatchId === batch.batchId &&
          review.aiParsedFlags.includes("spoiled_food"),
      ),
    );
    checks++;
    assert.equal(
      central.routes.find((route) =>
        route.assignedBatches.includes(batch.batchId),
      ).status,
      "completed",
    );
    checks++;
    await expectStatus(
      `/feedback/donor/${donor.user.id}/average`,
      "GET",
      undefined,
      donor.token,
      403,
    );
    await expectStatus(
      `/api/batches/${batch.batchId}/reject`,
      "PATCH",
      { reason: "Cannot reverse a finalized delivery" },
      admin.token,
      409,
    );
    const assignment = { batchId: secondBatch.batchId, driverId: driver.user.id, vehicleId: vehicle.vehicleId };
    const vehicleBody = { name: `Test ${run} truck`, registration: `TEST-${run}`, capacityServings: 100, capabilities: ['hot'], equipment: ['Hot holding boxes'], status: 'ready' };
    await call(`/api/fleet/vehicles/${vehicle.vehicleId}`, 'PUT', { ...vehicleBody, status: 'maintenance' }, admin.token);
    await expectStatus('/api/logistics/match', 'POST', assignment, admin.token, 409);
    await call(`/api/fleet/vehicles/${vehicle.vehicleId}`, 'PUT', { ...vehicleBody, capacityServings: 5 }, admin.token);
    await expectStatus('/api/logistics/match', 'POST', assignment, admin.token, 400);
    await call(`/api/fleet/vehicles/${vehicle.vehicleId}`, 'PUT', vehicleBody, admin.token);
    const releasedMatch = await call('/api/logistics/match', 'POST', assignment, admin.token);
    checks++;
    await call(`/api/logistics/routes/${releasedMatch.route.routeId}/cancel`, 'PATCH', { reason: 'Integration test: reassignment before pickup' }, admin.token);
    const rematched = await call('/api/logistics/match', 'POST', assignment, admin.token);
    assert.equal(rematched.route.vehicleId, vehicle.vehicleId); checks++;
    await call(`/api/batches/${secondBatch.batchId}/reject`, 'PATCH', { reason: 'Integration fixture cleanup quality hold' }, admin.token);
    console.log(
      `PASS: ${checks} API checks, including complete custody, authorization, privacy, GPS, proof reuse, transport, and concurrent dispatch.`,
    );
  } finally {
    if (ids.length) {
      const db = new Client({
        host: "127.0.0.1",
        user: "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: process.env.POSTGRES_DB || "samrit_db",
      });
      await db.connect();
      try {
        await db.query("BEGIN");
        const locationIds=(await db.query('SELECT location_id FROM food.donor_events WHERE donor_id=ANY($1::uuid[]) UNION SELECT location_id FROM directory.partner_centers WHERE owner_id=ANY($1::uuid[]) UNION SELECT b.location_id FROM food.food_batches b WHERE donor_id=ANY($1::uuid[]) UNION SELECT s.location_id FROM logistics.route_stops s JOIN logistics.routes r ON r.id=s.route_id WHERE r.driver_id=ANY($1::uuid[])',[ids])).rows.map(r=>r.location_id);
        for(const kind of ['route','review','scan','batch','photo','center','event','driver_location','vehicle'])await db.query('DELETE FROM app.domain_records WHERE kind=$1 AND (actor_id=ANY($2::uuid[]) OR id=ANY($3::uuid[]))',[kind,ids,fleetIds]);
        await db.query('DELETE FROM directory.providers WHERE organization_id=ANY($1::uuid[])',[ids]);
        await db.query('DELETE FROM directory.locations WHERE id=ANY($1::uuid[])',[locationIds]);
        await db.query('DELETE FROM identity.organizations WHERE owner_id=ANY($1::uuid[])',[ids]);
        await db.query(
          `DELETE FROM samrit_record WHERE payload->>'donorId' = ANY($1::text[]) OR payload->>'ownerId' = ANY($1::text[]) OR payload->>'driverId' = ANY($1::text[]) OR payload->>'actorId' = ANY($1::text[]) OR payload->>'authorId' = ANY($1::text[])`,
          [ids],
        );
        if (fleetIds.length) await db.query("DELETE FROM samrit_record WHERE id = ANY($1::uuid[])", [fleetIds]);
        await db.query('DELETE FROM "user" WHERE id = ANY($1::uuid[])', [ids]);
        await db.query("COMMIT");
      } finally {
        await db.end();
      }
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
