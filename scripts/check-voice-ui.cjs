const { chromium } = require("../frontend/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const shots = path.join(__dirname, "../.screenshots");
  await fs.mkdir(shots, { recursive: true });
  try {
    for (const [name, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://localhost:5173/consumer");
      await page.locator("article.sr-consumer-venue").first().waitFor();
      await page
        .getByRole("button", { name: "Open meal voice assistant" })
        .click();
      await page.getByRole("button", { name: "Enable assistant" }).click();
      await page.getByRole("button", { name: "Mute spoken replies" }).click();
      // Deterministic proposal; live provider round trip is checked separately.
      await page.route("**/api/consumer/voice/turn", (route) =>
        route.fulfill({
          json: {
            data: {
              reply: "Avoid peanuts and look for hot meals in East Village?",
              action: {
                type: "filters",
                allergens: ["Peanuts"],
                preferences: "Hot meals",
                area: "East Village",
              },
            },
          },
        }),
      );
      await page.route("**/api/consumer/search", (route) =>
        route.fulfill({
          json: {
            data: {
              mode: "gemini",
              matches: [
                { id: "east-village", match: "yes", reason: "Listed as hot." },
              ],
            },
          },
        }),
      );
      await page
        .getByLabel("Assistant message")
        .fill("Avoid peanuts and hot meals in East Village");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.getByRole("button", { name: "Confirm action" }).click();
      await page
        .getByText(
          "Filters updated. Review the matching demo meals on the page and confirm ingredients with staff.",
          { exact: false },
        )
        .waitFor();
      assert.equal(
        await page
          .getByLabel("Any other preferences or dietary restrictions?")
          .inputValue(),
        "Hot meals",
      );
      assert.equal(
        await page.getByLabel("Neighborhood or address").inputValue(),
        "East Village",
      );
      await page
        .getByRole("button", { name: "Remove Peanuts" })
        .waitFor({ state: "visible" });
      assert.equal(await page.locator("article.sr-consumer-venue").count(), 1);
      const dialog = page.getByRole("dialog", { name: "Meal voice assistant" });
      const box = await dialog.boundingBox();
      assert.ok(
        box.x >= 0 &&
          box.x + box.width <= width &&
          box.y >= 0 &&
          box.y + box.height <= height,
      );
      await page.screenshot({
        path: path.join(shots, "voice-" + name + "-light.png"),
      });
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await page.screenshot({
        path: path.join(shots, "voice-" + name + "-dark.png"),
      });
      await page.getByRole("button", { name: "Close meal assistant" }).click();
      await page.goto("http://localhost:5173/consumer/check-in");
      await page.route("**/api/consumer/visits/scan", (route) =>
        route.fulfill({
          json: {
            data: {
              visitId: "ui-fixture",
              secret: "ui-only",
              venueId: "fixture",
              recordedAt: new Date().toISOString(),
              location: null,
            },
          },
        }),
      );
      let finished = 0;
      await page.route("**/api/consumer/visits/finish", (route) => {
        finished++;
        return route.fulfill({
          json: { data: { finishedAt: new Date().toISOString() } },
        });
      });
      let submitted = 0;
      await page.route("**/api/consumer/visits/review", (route) => {
        submitted++;
        return route.fulfill({ json: { data: { received: true } } });
      });
      await page
        .getByLabel("Venue check-in QR code")
        .fill("SAMRIT:CENTER:ui-fixture");
      await page.getByRole("button", { name: "Check in", exact: true }).click();
      await page.getByText("You're checked in.").waitFor();
      await page
        .getByRole("button", { name: "Open meal voice assistant" })
        .click();
      await page.getByRole("button", { name: "Enable assistant" }).click();
      await page.getByRole("button", { name: "Mute spoken replies" }).click();
      await page.route("**/api/consumer/voice/turn", (route) =>
        route.fulfill({
          json: {
            data: {
              reply: "Review this draft.",
              action: {
                type: "start_review",
                sentiment: "positive",
                details: "Warm meal and helpful staff.",
              },
            },
          },
        }),
      );
      await page
        .getByLabel("Assistant message")
        .fill("Warm meal and helpful staff.");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.getByLabel("Optional details").waitFor();
      assert.equal(finished, 1);
      assert.equal(
        await page.getByLabel("Optional details").inputValue(),
        "Warm meal and helpful staff.",
      );
      assert.equal(submitted, 0);
      await page.route("**/api/consumer/voice/turn", (route) =>
        route.fulfill({
          json: {
            data: {
              reply: "Submit this private review?",
              action: { type: "submit_review" },
            },
          },
        }),
      );
      await page.getByLabel("Assistant message").fill("Submit my review");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page
        .getByText("Your private review was received for central NGO review.", {
          exact: true,
        })
        .waitFor();
      assert.equal(submitted, 1);
      assert.equal(
        await page.getByRole("button", { name: "Confirm submission" }).count(),
        0,
      );
      assert.deepEqual(errors, []);
      console.log(
        "PASS " +
          name +
          ": filter controls, map/results, light/dark panel bounds, review draft and explicit submission",
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
