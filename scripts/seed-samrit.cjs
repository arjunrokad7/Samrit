// Explicit local-only fixtures. Never run this against a production database.
const { readFile } = require("node:fs/promises");
const path = require("node:path");
require("../backend/node_modules/dotenv").config({
  path: path.join(__dirname, "../backend/.env"),
  quiet: true,
});
const base = process.env.SAMRIT_API_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Demo seeding is limited to localhost.");
const password = "Demo123!";
async function call(endpoint, method = "GET", body, token, expected) {
  const response = await fetch(base + endpoint, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
  });
  const result = await response.json();
  if (expected !== undefined) {
    if (response.status !== expected)
      throw new Error(
        `${endpoint}: expected ${expected}, received ${response.status}: ${JSON.stringify(result)}`,
      );
    return result;
  }
  if (!response.ok)
    throw new Error(`${method} ${endpoint}: ${JSON.stringify(result)}`);
  return result.data ?? result;
}
async function login(email, pass = password) {
  return call("/auth/login", "POST", { email, password: pass });
}
const pickup = {
  lat: 40.7306,
  lng: -73.9866,
  address: "100 Demo Market Street, New York, NY 10003",
};
const destination = {
  lat: 40.7265,
  lng: -73.9815,
  address: "200 Demo Community Avenue, New York, NY 10009",
};
async function photo(stage, location, token, batchId, sticker) {
  const form = new FormData();
  form.append(
    "image",
    new Blob(
      [await readFile(path.join(__dirname, `fixtures/stage-${stage}.png`))],
      { type: "image/png" },
    ),
    `demo-stage-${stage}.png`,
  );
  form.append("stage", String(stage));
  form.append("lat", String(location.lat));
  form.append("lng", String(location.lng));
  if (sticker) form.append("sticker", sticker);
  return call(
    batchId ? `/api/batches/${batchId}/photo` : "/api/photos",
    batchId ? "PUT" : "POST",
    form,
    token,
  );
}
async function seed() {
  const profiles = [
    {
      email: "donor@example.com",
      name: "Green Kitchen NYC · Demo",
      role: "DONOR",
      organizationName: "Green Kitchen NYC",
      organizationType: "Event caterer",
      address: pickup.address,
      phone: "+1-212-555-0101",
    },
    {
      email: "ngo@example.com",
      name: "Community Table NYC · Demo",
      role: "NGO",
      organizationName: "Community Table NYC",
      organizationType: "Community kitchen",
      address: destination.address,
      phone: "+1-212-555-0102",
    },
    {
      email: "volunteer@example.com",
      name: "Alex Rivera · Demo Driver",
      role: "VOLUNTEER",
      address: "300 Demo Volunteer Lane, New York, NY 10003",
      phone: "+1-212-555-0103",
    },
  ];
  const accounts = [];
  for (const profile of profiles) {
    try {
      await call("/auth/register", "POST", { ...profile, password });
    } catch (error) {
      if (!error.message.includes("Email already exists")) throw error;
    }
    const session = await login(profile.email);
    const { email, role, ...update } = profile;
    await call(
      "/auth/profile",
      "PATCH",
      {
        ...update,
        latitude: pickup.lat,
        longitude: pickup.lng,
        ...(role === "VOLUNTEER"
          ? {
              isAvailable: true,
              vehicleType: "van",
              vehicleNumber: "DEMO-NYC",
              transportCapabilities: [
                "hot",
                "refrigerated",
                "frozen",
                "shelf_stable",
              ],
            }
          : {}),
      },
      session.token,
    );
    accounts.push(session);
  }
  const [donor, centerUser, driver] = accounts;
  const admin = await login(
    process.env.SUPER_ADMIN_EMAIL || "admin@samrit.local",
    process.env.SUPER_ADMIN_PASSWORD || "SecureAdmin123!",
  );
  const center = await call(
    "/api/centers/profile",
    "PUT",
    {
      name: "East Village Community Table · Demo",
      location: destination,
      timeZone: "America/New_York",
      capabilities: {
        refrigeration: true,
        hotHolding: true,
        freezer: true,
        maxMealCapacity: 250,
      },
      operatingHours: { open: "00:00", close: "23:59" },
      seating: 60,
      staffing: 6,
    },
    centerUser.token,
  );
  await call(
    `/api/centers/${center.centerId}/approve`,
    "PATCH",
    {},
    admin.token,
  );
  let overview = await call(
    "/api/samrit/overview",
    "GET",
    undefined,
    donor.token,
  );
  const dishes = [
    [
      "Roasted vegetable pasta",
      "hot",
      ["Wheat"],
      ["Pasta", "Zucchini", "Tomato"],
      35,
    ],
    [
      "Harvest rice bowls",
      "hot",
      ["Soybeans", "Sesame"],
      ["Rice", "Vegetables", "Soy sauce", "Sesame"],
      45,
    ],
    [
      "Garden salad boxes",
      "refrigerated",
      [],
      ["Lettuce", "Carrots", "Cucumber"],
      25,
    ],
    [
      "Bakery breakfast packs",
      "shelf_stable",
      ["Wheat", "Milk", "Eggs"],
      ["Bread", "Butter", "Eggs"],
      30,
    ],
    ["Frozen fruit dessert", "frozen", ["Milk"], ["Milk", "Strawberries"], 20],
  ];
  for (let index = 0; index < dishes.length; index++) {
    const [
      name,
      handlingRequirement,
      allergens,
      ingredients,
      estimatedServings,
    ] = dishes[index];
    const eventName = `NYC Demo · ${["Community lunch", "Midtown conference", "Neighborhood gathering", "Morning meetup", "Catering showcase"][index]}`;
    if (overview.events.some((event) => event.name === eventName)) continue;
    const item = {
      name,
      handlingRequirement,
      allergens,
      ingredients,
      estimatedServings,
      verified: true,
    };
    const event = await call(
      "/api/events",
      "POST",
      {
        name: eventName,
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
        location: pickup,
        items: [item],
        notes:
          "FICTIONAL DEMO: synthetic evidence and simulated GPS. Use genuine device photos and location for real handoffs.",
      },
      donor.token,
    );
    const evidence = await photo(1, pickup, donor.token);
    const batch = await call(
      "/api/batches",
      "POST",
      {
        donorEventId: event.eventId,
        items: [item],
        handlingRequirement,
        expiresAt: new Date(Date.now() + (index + 4) * 3600000).toISOString(),
        photoId: evidence.photoId,
      },
      donor.token,
    );
    if (index < 2) {
      await call(
        "/api/logistics/match",
        "POST",
        { batchId: batch.batchId, driverId: driver.user.id },
        admin.token,
      );
      if (index === 0) {
        await call(
          "/api/logistics/scan",
          "POST",
          {
            batchId: batch.batchId,
            kind: "event",
            value: `SAMRIT:EVENT:${event.eventId}`,
            ...pickupGps(),
          },
          driver.token,
        );
        await photo(2, pickup, driver.token, batch.batchId);
        const sticker = `SAMRIT-DEMO-${batch.batchId.slice(0, 8)}`;
        await call(
          "/api/logistics/link-qr",
          "POST",
          { batchId: batch.batchId, qrStickerId: sticker, ...pickupGps() },
          driver.token,
        );
        await call(
          "/api/logistics/scan",
          "POST",
          {
            batchId: batch.batchId,
            kind: "center",
            value: center.locationQrCode,
            lat: destination.lat,
            lng: destination.lng,
          },
          driver.token,
        );
        await photo(3, destination, centerUser.token, batch.batchId, sticker);
        await call(
          "/api/reviews/process",
          "POST",
          {
            targetType: "donor",
            targetId: donor.user.id,
            linkedBatchId: batch.batchId,
            sentiment: "positive",
            rawText:
              "Demo review: food was fresh, sealed, and clearly labeled.",
          },
          centerUser.token,
        );
      }
    }
    console.log(
      `${eventName}: ${index === 0 ? "delivered with all three proofs" : index === 1 ? "matched to driver" : "pending dispatch"}`,
    );
  }
  overview = await call("/api/samrit/overview", "GET", undefined, admin.token);
  console.log(
    JSON.stringify({
      batches: overview.batches.length,
      routes: overview.routes.length,
      centers: overview.centers.length,
      privateReviews: overview.reviews.length,
    }),
  );
  return { donor, centerUser, driver, admin, center };
}
function pickupGps() {
  return { lat: pickup.lat, lng: pickup.lng };
}
module.exports = { call, login, photo, seed, pickup, destination };
if (require.main === module)
  seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
