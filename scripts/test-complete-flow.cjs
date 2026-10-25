// Hybrid end-to-end test: real browser UI + real API/database; unique disposable fixtures.
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { Client, config } = require("./db/connection.cjs");
const { call: rawCall, login } = require("./seed-samrit.cjs");
const { chromium } = require("../frontend/node_modules/playwright");
const React = require("../frontend/node_modules/react");
const {
  renderToStaticMarkup,
} = require("../frontend/node_modules/react-dom/server");
const { QRCodeSVG } = require("../frontend/node_modules/qrcode.react");
const args = new Set(process.argv.slice(2));
if ([...args].some((a) => !["--with-ai", "--headed"].includes(a)))
  throw Error("Usage: npm run test:complete -- [--with-ai] [--headed]");
const withAI = args.has("--with-ai");
const run = randomUUID().slice(0, 8);
const base = process.env.E2E_BASE_URL || "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("This fixture test is limited to localhost.");
const output = path.resolve(__dirname, "../test-results/complete-flow-" + run);
const ids = [],
  vehicleIds = [],
  documents = [],
  visits = [],
  relatedIds = [];
const report = {
  run,
  mode: withAI ? "live-gemini" : "core-workflow",
  startedAt: new Date().toISOString(),
  checks: [],
  skipped: withAI
    ? []
    : [
        "Live Gemini menu/invoice OCR and preference assertions (use --with-ai).",
      ],
  status: "running",
};
const pickup = {
  lat: 40.7841,
  lng: -73.9501,
  address: "Fictional test pickup, New York, NY 10028",
};
const destination = {
  lat: 40.784,
  lng: -73.95,
  address: "Fictional test center, New York, NY 10028",
};
const fixturePassword = "TestComplete123!";
async function cooldown() {
  console.log(
    "Rate limit reached; respecting the one-minute cooldown before retrying.",
  );
  await new Promise((resolve) => setTimeout(resolve, 61000));
}
async function call(...values) {
  try {
    return await rawCall(...values);
  } catch (error) {
    if (!/429|Please wait before trying again/.test(error.message)) throw error;
    await cooldown();
    return rawCall(...values);
  }
}
function pass(name) {
  report.checks.push(name);
  console.log("PASS: " + name);
}
async function register(role) {
  const email = `complete-${run}-${role.toLowerCase()}@example.com`;
  const account = await call("/auth/register", "POST", {
    email,
    name: `Complete flow ${run} ${role}`,
    role,
    password: fixturePassword,
  });
  ids.push(account.user.id);
  return account;
}
async function upload(stage, token, batchId, sticker) {
  const at = stage === 3 ? destination : pickup;
  const form = new FormData();
  form.append(
    "image",
    new Blob(
      [
        await fs.readFile(
          path.resolve(__dirname, `fixtures/stage-${stage}.png`),
        ),
      ],
      { type: "image/png" },
    ),
    "synthetic-test-photo.png",
  );
  for (const [key, value] of Object.entries({
    stage,
    lat: at.lat,
    lng: at.lng,
    ...(sticker ? { sticker } : {}),
  }))
    form.append(key, String(value));
  return call(
    batchId ? `/api/batches/${batchId}/photo` : "/api/photos",
    batchId ? "PUT" : "POST",
    form,
    token,
  );
}
async function cleanup(db) {
  const photos = (
    await db.query(
      "SELECT p.url FROM evidence.photos p WHERE actor_id=ANY($1::uuid[])",
      [ids],
    )
  ).rows;
  const storedDocs = (
    await db.query(
      "SELECT storage_path FROM food.event_documents WHERE uploader_id=ANY($1::uuid[])",
      [ids],
    )
  ).rows;
  await db.query("BEGIN");
  try {
    const locations = (
      await db.query(
        "SELECT location_id FROM food.donor_events WHERE donor_id=ANY($1::uuid[]) UNION SELECT location_id FROM directory.partner_centers WHERE owner_id=ANY($1::uuid[]) UNION SELECT location_id FROM food.food_batches WHERE donor_id=ANY($1::uuid[]) UNION SELECT s.location_id FROM logistics.route_stops s JOIN logistics.routes r ON r.id=s.route_id WHERE r.driver_id=ANY($1::uuid[])",
        [ids],
      )
    ).rows.map((r) => r.location_id);
    const recordIds = (
      await db.query(
        "SELECT id FROM app.domain_records WHERE actor_id=ANY($1::uuid[]) OR id=ANY($2::uuid[])",
        [ids, vehicleIds],
      )
    ).rows.map((r) => r.id);
    await db.query(
      "DELETE FROM feedback.visits WHERE id=ANY($1::uuid[]) OR location_id=ANY($2::uuid[])",
      [visits, locations],
    );
    await db.query(
      "DELETE FROM food.event_documents WHERE uploader_id=ANY($1::uuid[])",
      [ids],
    );
    await db.query(
      "DELETE FROM app.ai_jobs WHERE actor_id=ANY($1::uuid[]) OR related_id=ANY($2::uuid[])",
      [ids, [...documents, ...relatedIds]],
    );
    for (const kind of [
      "route",
      "review",
      "scan",
      "batch",
      "photo",
      "center",
      "event",
      "driver_location",
      "vehicle",
    ])
      await db.query(
        "DELETE FROM app.domain_records WHERE kind=$1 AND (actor_id=ANY($2::uuid[]) OR id=ANY($3::uuid[]))",
        [kind, ids, vehicleIds],
      );
    await db.query(
      "DELETE FROM directory.providers WHERE organization_id=ANY($1::uuid[])",
      [ids],
    );
    await db.query("DELETE FROM directory.locations WHERE id=ANY($1::uuid[])", [
      locations,
    ]);
    await db.query(
      "DELETE FROM identity.organizations WHERE owner_id=ANY($1::uuid[])",
      [ids],
    );
    await db.query(
      "DELETE FROM audit.audit_events WHERE actor_id=ANY($1::uuid[]) OR record_id=ANY($2::uuid[])",
      [ids, [...recordIds, ...relatedIds]],
    );
    await db.query('DELETE FROM public."user" WHERE id=ANY($1::uuid[])', [ids]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
  // Delete only exact UUID fixture files within configured storage directories.
  for (const [folder, files] of [
    [
      process.env.UPLOAD_DIR || "uploads",
      photos.map((r) => path.basename(r.url)),
    ],
    [
      process.env.PRIVATE_DOCUMENT_DIR || "private_documents",
      storedDocs.map((r) => r.storage_path),
    ],
  ]) {
    const root = path.resolve(__dirname, "../backend", folder);
    for (const file of files) {
      const target = path.resolve(root, file);
      if (
        path.dirname(target) !== root ||
        !/^[a-f0-9-]{36}(\.(png|jpe?g|webp))?$/.test(file)
      )
        throw Error("Unexpected fixture file path");
      await fs.unlink(target).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
    }
  }
  assert.equal(
    Number(
      (
        await db.query(
          'SELECT count(*) FROM public."user" WHERE id=ANY($1::uuid[])',
          [ids],
        )
      ).rows[0].count,
    ),
    0,
  );
}
async function main() {
  await fs.mkdir(output, { recursive: true });
  const db = new Client(config);
  await db.connect();
  let browser, page, failure;
  try {
    browser = await chromium.launch({
      headless: !args.has("--headed"),
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : process.env.CI
          ? {}
          : { channel: "chrome" }),
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      geolocation: {
        latitude: destination.lat,
        longitude: destination.lng,
        accuracy: 10,
      },
      permissions: ["geolocation"],
    });
    page = await context.newPage();
    page.setDefaultTimeout(120000);
    await page.route("**/api/consumer/visits/**", async (route) => {
      let response = await route.fetch({ timeout: 60000 });
      if (response.status() === 429) {
        await cooldown();
        response = await route.fetch({ timeout: 60000 });
      }
      await route.fulfill({ response });
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Switch to light theme" }).waitFor();
    for (const size of [
      { width: 390, height: 844 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(size);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        ),
        false,
      );
    }
    pass("Landing, responsive layout, dark-theme toggle and persisted choice");
    for (const [route, heading] of [
      ["/terms", /Terms/i],
      ["/regulations", /Food Donation/i],
    ]) {
      await page.goto(base + route);
      await page.getByRole("heading", { level: 1, name: heading }).waitFor();
    }
    await page.goto(base + "/consumer");
    await page
      .getByRole("heading", { name: "East Village Community Table" })
      .waitFor();
    await page
      .getByRole("button", { name: "Select your allergens", exact: true })
      .click();
    await page.getByRole("checkbox", { name: "Wheat", exact: true }).check();
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .getByRole("heading", { name: "East Village Community Table" })
        .count(),
      0,
    );
    await page.getByRole("button", { name: "Remove Wheat" }).click();
    await page
      .getByRole("heading", { name: "East Village Community Table" })
      .waitFor();
    assert.ok((await call("/api/consumer/directory")).length > 0);
    pass("Legal pages, allergen filtering and sourced public directory");
    if (withAI) {
      await page
        .getByLabel("Any other preferences or dietary restrictions?")
        .fill("I cannot eat cold food");
      await page
        .getByRole("button", { name: "Find meals for my preferences" })
        .click();
      await page.getByText(/Gemini preferences applied/).waitFor();
      assert.equal(
        await page
          .getByRole("heading", { name: "Union Square Shared Table" })
          .count(),
        0,
      );
      pass("Live Gemini excludes explicitly cold meals");
    }
    const donor = await register("DONOR"),
      centerUser = await register("NGO");
    const admin = await login(
      process.env.SUPER_ADMIN_EMAIL || "admin@samrit.local",
      process.env.SUPER_ADMIN_PASSWORD || "SecureAdmin123!",
    );
    const driverEmail = `complete-${run}-driver@example.com`;
    const driverUser = await call(
      "/api/fleet/drivers",
      "POST",
      {
        name: "Complete flow fixture driver",
        email: driverEmail,
        password: fixturePassword,
        isAvailable: true,
        location: pickup,
      },
      admin.token,
    );
    ids.push(driverUser.id);
    const driver = await login(driverEmail, fixturePassword);
    const vehicle = await call(
      "/api/fleet/vehicles",
      "POST",
      {
        name: "Complete flow fixture truck",
        registration: "E2E-" + run,
        capacityServings: 100,
        capabilities: ["hot"],
        equipment: ["Insulated hot holding boxes"],
        status: "ready",
      },
      admin.token,
    );
    vehicleIds.push(vehicle.vehicleId);
    const minute =
      Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "America/New_York",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      ) *
        60 +
      new Date().getUTCMinutes();
    const time = (n) =>
      `${String(Math.floor(((n + 1440) % 1440) / 60)).padStart(2, "0")}:${String(((n + 1440) % 1440) % 60).padStart(2, "0")}`;
    const center = await call(
      "/api/centers/profile",
      "PUT",
      {
        name: "Complete flow fixture kitchen " + run,
        location: destination,
        timeZone: "America/New_York",
        capabilities: {
          refrigeration: true,
          hotHolding: true,
          freezer: false,
          maxMealCapacity: 100,
        },
        operatingHours: { open: time(minute - 60), close: time(minute + 120) },
        seating: 10,
        staffing: 2,
      },
      centerUser.token,
    );
    await call(
      `/api/centers/${center.centerId}/approve`,
      "PATCH",
      {},
      admin.token,
    );
    pass(
      "Donor and center accounts; admin-provisioned driver, hot vehicle and approved center",
    );
    let item = {
      name: "Hot vegetable soup",
      ingredients: ["Carrots", "Potatoes", "Water"],
      allergens: [],
      estimatedServings: 30,
      handlingRequirement: "hot",
      verified: true,
      metadata: { notes: "Synthetic complete-flow fixture" },
    };
    if (withAI) {
      const documentPage = await context.newPage();
      await documentPage.setContent(
        "<h1>FICTIONAL TEST MENU</h1><h2>Hot vegetable soup</h2><p>30 servings. Served hot. Ingredients: Carrots, Potatoes, Water. Allergen information not supplied; staff must confirm.</p>",
      );
      const pdf = await documentPage.pdf();
      await fs.writeFile(path.join(output, "sample-menu.pdf"), pdf);
      await documentPage.setContent(
        '<h1>FICTIONAL TEST INVOICE</h1><p>Invoice TEST-001. Supplier: Test Kitchen. Customer: Test Event. Not valid for payment.</p><table><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr><tr><td>Hot vegetable soup</td><td>30 servings</td><td>$4.00 USD</td><td>$120.00 USD</td></tr></table><p>Served hot. Ingredients: Carrots, Potatoes, Water. Allergen information not supplied; staff must confirm. Invoice quantities are supplied portions, not leftover quantities.</p>',
      );
      const invoicePDF = await documentPage.pdf();
      await fs.writeFile(path.join(output, "sample-invoice.pdf"), invoicePDF);
      await documentPage.close();
      for (const documentType of ["menu", "invoice"]) {
        const form = new FormData();
        form.append(
          "image",
          new Blob([documentType === "menu" ? pdf : invoicePDF], { type: "application/pdf" }),
          documentType + ".pdf",
        );
        form.append("documentType", documentType);
        const result = await call(
          "/api/event-documents",
          "POST",
          form,
          donor.token,
        );
        documents.push(result.documentId);
        assert.equal(result.mode, "gemini");
        assert.ok(result.items.length);
        assert.equal(result.items[0].verified, false);
        if (documentType === "menu")
          item = {
            ...item,
            name: result.items[0].name,
            sourceCandidateId: result.items[0].sourceCandidateId,
          };
      }
      pass(
        "Live menu and invoice OCR produce unverified candidates; test explicitly confirms dish details",
      );
    }
    const eventInput = {
      name: "Complete flow event " + run,
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      location: pickup,
      items: [item],
      documentIds: documents,
    };
    await call(
      "/api/events",
      "POST",
      { ...eventInput, items: [{ ...item, verified: false }] },
      donor.token,
      400,
    );
    const event = await call("/api/events", "POST", eventInput, donor.token);
    const sticker = "COMPLETE-" + run,
      eventQR = "SAMRIT:EVENT:" + event.eventId;
    const qrPage = await context.newPage();
    for (const [name, value] of [
      ["venue", center.locationQrCode],
      ["event", eventQR],
      ["container", sticker],
    ]) {
      await qrPage.setContent(
        renderToStaticMarkup(
          React.createElement(QRCodeSVG, { value, size: 400, marginSize: 4 }),
        ),
      );
      await qrPage
        .locator("svg")
        .screenshot({ path: path.join(output, name + "-qr.png") });
    }
    await qrPage.close();
    pass(
      "Human confirmation enforced; saved event and fresh QR image artifacts",
    );
    const evidence = await upload(1, donor.token);
    const batchInput = {
      donorEventId: event.eventId,
      items: [{ ...item, estimatedServings: 10 }],
      handlingRequirement: "hot",
      expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      photoId: evidence.photoId,
    };
    await call(
      "/api/batches",
      "POST",
      { ...batchInput, items: [{ ...item, estimatedServings: 31 }] },
      donor.token,
      400,
    );
    const batch = await call("/api/batches", "POST", batchInput, donor.token);
    const assignment = {
      batchId: batch.batchId,
      driverId: driverUser.id,
      vehicleId: vehicle.vehicleId,
    };
    await call("/api/logistics/match", "POST", assignment, donor.token, 403);
    const match = await call(
      "/api/logistics/match",
      "POST",
      assignment,
      admin.token,
    );
    assert.equal(match.route.centerId, center.centerId);
    await call(
      `/api/fleet/vehicles/${vehicle.vehicleId}`,
      "PUT",
      {
        name: "Busy truck",
        registration: "E2E-" + run,
        capacityServings: 100,
        capabilities: ["hot"],
        equipment: [],
        status: "maintenance",
      },
      admin.token,
      409,
    );
    pass(
      "Leftover limits, admin dispatch, correct center and busy-resource protection",
    );
    await call(
      "/api/logistics/scan",
      "POST",
      { batchId: batch.batchId, kind: "event", value: eventQR, lat: 0, lng: 0 },
      driver.token,
      400,
    );
    await call(
      "/api/logistics/scan",
      "POST",
      {
        batchId: batch.batchId,
        kind: "event",
        value: eventQR,
        lat: pickup.lat,
        lng: pickup.lng,
      },
      driver.token,
    );
    await upload(2, driver.token, batch.batchId);
    await call(
      "/api/logistics/link-qr",
      "POST",
      {
        batchId: batch.batchId,
        qrStickerId: sticker,
        lat: pickup.lat,
        lng: pickup.lng,
      },
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
    const delivered = await upload(3, centerUser.token, batch.batchId, sticker);
    assert.equal(delivered.status, "delivered");
    for (const proof of Object.values(delivered.chainOfCustody))
      assert.ok(proof?.sha256);
    const central = await call(
      "/api/samrit/overview",
      "GET",
      undefined,
      admin.token,
    );
    assert.equal(
      central.routes.find((r) => r.routeId === match.route.routeId).status,
      "completed",
    );
    pass(
      "GPS rejection, event QR, pickup photo, container sticker, shared venue QR, intake and all custody hashes",
    );
    await page.goto(base + "/consumer/check-in");
    await page.getByLabel("Venue check-in QR code").fill(center.locationQrCode);
    const entryResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/consumer/visits/scan") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Check in", exact: true }).click();
    const entryResult = await entryResponse;
    assert.ok(entryResult.ok(), "Visitor check-in must succeed");
    const entry = (await entryResult.json()).data;
    visits.push(entry.visitId);
    await page.getByText("You're checked in.").waitFor();
    assert.equal(await page.getByLabel("Exit QR code").count(), 0);
    await call(
      "/api/consumer/visits/review",
      "POST",
      {
        visitId: entry.visitId,
        secret: entry.secret,
        sentiment: "positive",
        rawText: "Before finish",
      },
      undefined,
      400,
    );
    await call(
      "/api/consumer/visits/finish",
      "POST",
      { visitId: entry.visitId, secret: "wrong-visit-secret-1234567890" },
      undefined,
      403,
    );
    await page
      .getByRole("button", { name: "Finish visit and leave a review" })
      .click();
    await page
      .getByRole("button", { name: "Good experience", exact: true })
      .click();
    await page
      .getByLabel("Optional details")
      .fill("The meal was warm and the staff were helpful.");
    const reviewResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/consumer/visits/review") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Submit private review" }).click();
    const reviewResult = await reviewResponse;
    assert.ok(reviewResult.ok(), "Private review submission must succeed");
    const review = (await reviewResult.json()).data;
    relatedIds.push(review.reviewId);
    await page.getByText(/Your private review was received/).waitFor();
    await page.screenshot({
      path: path.join(output, "visitor-review.png"),
      fullPage: true,
    });
    const saved = (
      await db.query(
        "SELECT completion_method,finished_at FROM feedback.visits WHERE id=$1",
        [entry.visitId],
      )
    ).rows[0];
    assert.equal(saved.completion_method, "button");
    assert.ok(saved.finished_at);
    assert.equal(
      Number(
        (
          await db.query(
            "SELECT count(*) FROM feedback.visit_scans WHERE visit_id=$1 AND phase='exit'",
            [entry.visitId],
          )
        ).rows[0].count,
      ),
      0,
    );
    pass(
      "Browser check-in with the delivery venue QR, secure finish button and private review without any exit scan",
    );
    await call("/api/admin/visit-reviews", "GET", undefined, donor.token, 403);
    await call(
      "/api/admin/visit-reviews",
      "GET",
      undefined,
      centerUser.token,
      403,
    );
    await call("/api/admin/visit-reviews", "GET", undefined, driver.token, 403);
    const reviews = await call(
      "/api/admin/visit-reviews",
      "GET",
      undefined,
      admin.token,
    );
    const savedReview = reviews.find((r) => r.id === review.reviewId);
    assert.ok(savedReview);
    assert.equal(savedReview.requires_human_review, true);
    if (withAI) assert.equal(savedReview.analysis_mode, "gemini");
    await call(
      "/api/consumer/visits/review",
      "POST",
      {
        visitId: entry.visitId,
        secret: entry.secret,
        sentiment: "negative",
        rawText: "Duplicate",
      },
      undefined,
      400,
    );
    assert.deepEqual(errors, []);
    pass(
      "Central-admin-only review and human-review analysis, duplicate rejection and no browser errors",
    );
    report.status = "passed";
  } catch (error) {
    failure = error;
    report.status = "failed";
    report.error = error.message;
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
        .catch(() => {});
  } finally {
    if (browser) await browser.close();
    try {
      await cleanup(db);
      report.cleanup = "passed";
    } catch (error) {
      report.cleanup = "failed";
      report.cleanupError = error.message;
      failure ||= error;
      report.status = "failed";
    }
    await db.end();
    report.finishedAt = new Date().toISOString();
    await fs.writeFile(
      path.join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
  }
  if (failure) throw failure;
  console.log(
    `PASS: ${report.checks.length} complete-flow checkpoints; fixtures removed. Report: ${path.relative(process.cwd(), path.join(output, "report.json"))}`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
