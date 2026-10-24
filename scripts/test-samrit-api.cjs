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
    const driver = await register("VOLUNTEER");
    const admin = await login(
      process.env.SUPER_ADMIN_EMAIL || "admin@samrit.local",
      process.env.SUPER_ADMIN_PASSWORD || "SecureAdmin123!",
    );
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
        items: [item],
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
      { batchId: batch.batchId },
      donor.token,
      403,
    );
    await call("/auth/profile", "PATCH", { isAvailable: true }, driver.token);
    await expectStatus(
      "/api/logistics/match",
      "POST",
      { batchId: batch.batchId, driverId: driver.user.id },
      admin.token,
      400,
    ); // No hot transport.
    await call(
      "/auth/profile",
      "PATCH",
      { transportCapabilities: ["hot"], latitude: gps.lat, longitude: gps.lng },
      driver.token,
    );
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
          }),
        }),
      ),
    );
    assert.deepEqual(
      matches.map((response) => response.status).sort(),
      [200, 409],
    );
    checks++;
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
        await db.query(
          `DELETE FROM samrit_record WHERE payload->>'donorId' = ANY($1::text[]) OR payload->>'ownerId' = ANY($1::text[]) OR payload->>'driverId' = ANY($1::text[]) OR payload->>'actorId' = ANY($1::text[]) OR payload->>'authorId' = ANY($1::text[])`,
          [ids],
        );
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
