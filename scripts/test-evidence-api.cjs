const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const { unlink } = require("node:fs/promises");
const { Client, config } = require("./db/connection.cjs");
const { call, login } = require("./seed-samrit.cjs");
const { chromium } = require("../frontend/node_modules/playwright");
async function run() {
  const db = new Client(config);
  await db.connect();
  let browser, actor, documentId, eventId, visitId, reviewId;
  let checks = 0;
  try {
    actor = await call("/auth/register", "POST", {
      email: `evidence-test-${randomUUID()}@example.com`,
      name: "Evidence workflow fixture",
      password: "TestEvidence123!",
      role: "DONOR",
    });
    const admin = await login(
      process.env.SUPER_ADMIN_EMAIL || "admin@samrit.local",
      process.env.SUPER_ADMIN_PASSWORD || "SecureAdmin123!",
    );
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.setContent(
      "<h1>Event menu</h1><h2>Vegetable soup</h2><p>20 servings. Served hot.</p><p>Ingredients: carrots, potatoes, water.</p><p>Allergen information not provided.</p>",
    );
    const pdf = await page.pdf();
    const form = new FormData();
    form.append(
      "image",
      new Blob([pdf], { type: "application/pdf" }),
      "fixture-menu.pdf",
    );
    form.append("documentType", "menu");
    const doc = await call("/api/event-documents", "POST", form, actor.token);
    documentId = doc.documentId;
    assert.equal(
      doc.mode,
      "gemini",
      "Live menu extraction must use Gemini, not manual fallback",
    );
    assert.ok(doc.items.length);
    assert.equal(doc.items[0].verified, false);
    checks += 3;
    const candidate = doc.items[0];
    const item = {
      name: candidate.name,
      ingredients: candidate.ingredients,
      allergens: candidate.allergens,
      estimatedServings: 20,
      handlingRequirement: "hot",
      verified: true,
      sourceCandidateId: candidate.sourceCandidateId,
      metadata: { notes: "Human confirmed fixture dish" },
    };
    const eventInput = {
      name: "Evidence fixture",
      scheduledAt: new Date().toISOString(),
      location: {
        lat: 40.73,
        lng: -73.98,
        address: "Fictional integration fixture, New York, NY",
      },
      items: [item],
      documentIds: [documentId],
      metadata: { notes: "Test-only metadata" },
    };
    await call(
      "/api/events",
      "POST",
      { ...eventInput, items: [{ ...item, verified: false }] },
      actor.token,
      400,
    );
    checks++;
    const event = await call("/api/events", "POST", eventInput, actor.token);
    eventId = event.eventId;
    assert.equal(
      Number(
        (
          await db.query(
            "SELECT count(*) FROM food.document_item_links WHERE candidate_id=$1",
            [candidate.sourceCandidateId],
          )
        ).rows[0].count,
      ),
      1,
    );
    checks++;
    await call(
      `/api/event-documents/${documentId}/original`,
      "GET",
      undefined,
      undefined,
      401,
    );
    checks++;
    const other = await login("ngo@example.com", "Demo123!");
    await call(
      `/api/event-documents/${documentId}/original`,
      "GET",
      undefined,
      other.token,
      403,
    );
    checks++;
    const matched = await call("/api/consumer/search", "POST", {
      text: "i cant eat cold fooood",
      allergens: [],
    });
    assert.equal(
      matched.matches.find((m) => m.id === "union-square").match,
      "no",
    );
    assert.ok(matched.matches.some((m) => m.match === "yes"));
    checks += 2;
    await call(
      "/api/consumer/visits/scan",
      "POST",
      { code: "invalid-token", phase: "entry", method: "manual" },
      undefined,
      400,
    );
    checks++;
    const centerOverview=await call("/api/samrit/overview","GET",undefined,other.token);
    const venueCode=centerOverview.centers[0].locationQrCode;
    const entry = await call("/api/consumer/visits/scan", "POST", {
      code: venueCode,
      phase: "entry",
      method: "manual",
      deviceRecordedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      location: null,
    });
    visitId = entry.visitId;
    await call(
      "/api/consumer/visits/scan",
      "POST",
      {
        code: "samrit:visit:union-square:exit",
        phase: "exit",
        method: "manual",
        visitId,
        secret: entry.secret,
      },
      undefined,
      400,
    );
    checks++;
    await call(
      "/api/consumer/visits/review",
      "POST",
      {
        visitId,
        secret: entry.secret,
        sentiment: "negative",
        rawText: "Long line, no food.",
      },
      undefined,
      400,
    );
    checks++;
    await call('/api/consumer/visits/finish','POST',{visitId,secret:'invalid-secret-12345678901234567890'},undefined,403);checks++;
    await call('/api/consumer/visits/finish','POST',{visitId,secret:entry.secret});
    const review = await call("/api/consumer/visits/review", "POST", {
      visitId,
      secret: entry.secret,
      sentiment: "negative",
      rawText: "Long line, I did not receive food.",
    });
    reviewId = review.reviewId;
    const analysis = (
      await db.query(
        "SELECT * FROM feedback.review_analysis WHERE visit_review_id=$1",
        [reviewId],
      )
    ).rows[0];
    assert.equal(analysis.analysis_mode, "gemini");
    assert.equal(analysis.requires_human_review, true);
    checks += 2;
    await call("/api/admin/visit-reviews", "GET", undefined, actor.token, 403);
    checks++;
    const reviews = await call(
      "/api/admin/visit-reviews",
      "GET",
      undefined,
      admin.token,
    );
    assert.ok(reviews.some((r) => r.id === reviewId));
    checks++;
    await call(
      "/api/consumer/visits/review",
      "POST",
      {
        visitId,
        secret: entry.secret,
        sentiment: "positive",
        rawText: "Duplicate",
      },
      undefined,
      400,
    );
    checks++;
    const times = (
      await db.query(
        "SELECT created_at AS started,finished_at AS ended FROM feedback.visits WHERE id=$1",
        [visitId],
      )
    ).rows[0];
    assert.ok(
      times.ended - times.started < 45000,
      "Server times must not trust claimed device duration",
    );
    checks++;
    console.log(
      `PASS: ${checks} live evidence checks: Gemini PDF OCR, confirmation, private documents, smart filtering, server-timed visits, private AI review and access control.`,
    );
  } finally {
    if (browser) await browser.close();
    await db.query("BEGIN");
    try {
      if (visitId)
        await db.query("DELETE FROM feedback.visits WHERE id=$1", [visitId]);
      if (documentId)
        await db.query("DELETE FROM food.event_documents WHERE id=$1", [
          documentId,
        ]);
      if (eventId) {
        const l = (
          await db.query(
            "SELECT location_id FROM food.donor_events WHERE id=$1",
            [eventId],
          )
        ).rows[0];
        await db.query("DELETE FROM app.domain_records WHERE id=$1", [eventId]);
        if (l)
          await db.query("DELETE FROM directory.locations WHERE id=$1", [
            l.location_id,
          ]);
      }
      if (actor) {
        await db.query("DELETE FROM identity.organizations WHERE owner_id=$1", [
          actor.user.id,
        ]);
        await db.query('DELETE FROM public."user" WHERE id=$1', [
          actor.user.id,
        ]);
      }
      await db.query("COMMIT");
      if (documentId)
        await unlink(
          path.resolve(__dirname, "../backend/private_documents", documentId),
        ).catch(() => {});
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      await db.end();
    }
  }
}
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
