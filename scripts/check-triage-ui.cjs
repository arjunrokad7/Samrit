const { chromium } = require("../frontend/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const fixture = {
    config: {
      city: "New York City",
      timeZone: "America/New_York",
      aiConfigured: true,
    },
    batches: [],
    centers: [],
    routes: [],
    reviews: [],
    scans: [],
    drivers: [],
    vehicles: [],
    events: [
      {
        eventId: "fixture",
        name: "Mixed menu fixture",
        donorId: "fixture",
        scheduledAt: "2026-01-01T12:00:00Z",
        location: { lat: 40.73, lng: -73.98, address: "Test NYC" },
        items: [
          {
            name: "Hot soup",
            estimatedServings: 30,
            handlingRequirement: "hot",
            ingredients: [],
            allergens: [],
            verified: true,
          },
          {
            name: "Cold salad",
            estimatedServings: 20,
            handlingRequirement: "refrigerated",
            ingredients: [],
            allergens: [],
            verified: true,
          },
          {
            name: "Frozen fruit",
            estimatedServings: 10,
            handlingRequirement: "frozen",
            ingredients: [],
            allergens: [],
            verified: true,
          },
        ],
      },
    ],
  };
  try {
    for (const role of ["DONOR", "NGO", "VOLUNTEER", "ADMIN"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      await context.addInitScript(() =>
        localStorage.setItem("token", "browser-fixture-only"),
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/auth/profile", (route) =>
        route.fulfill({
          json: {
            id: "fixture",
            name: "Workflow test",
            email: "fixture@example.com",
            role,
          },
        }),
      );
      await page.route("**/api/samrit/overview", (route) =>
        route.fulfill({ json: { success: true, data: fixture } }),
      );
      await page.goto("http://localhost:5173/dashboard");
      await page
        .getByRole("heading", { name: "A little coordination. A lot of good." })
        .waitFor();
      assert.equal(await page.locator('a[href="/consumer"]').count(), 0);
      if (role === "DONOR") {
        await page
          .getByRole("button", { name: "Leftover triage", exact: true })
          .click();
        const dish = page.getByRole("checkbox", { name: /Hot soup/ });
        await dish.check();
        const servings = page.getByLabel("Servings for Hot soup");
        await servings.fill("");
        assert.ok(await dish.isChecked());
        assert.ok(await servings.isEnabled());
        assert.ok(
          await page
            .getByRole("button", { name: "Create rescue batch" })
            .isDisabled(),
        );
        await servings.fill("0");
        assert.ok(await dish.isChecked());
        assert.ok(
          await page
            .getByRole("button", { name: "Create rescue batch" })
            .isDisabled(),
        );
        await servings.fill("5");
        await page.getByRole("checkbox", { name: /Cold salad/ }).check();
        await page.getByRole("checkbox", { name: /Frozen fruit/ }).check();
        await page.locator('summary[aria-label="Batch handling"]').click();
        const handling = page.getByRole("group", {
          name: "Handling requirements",
        });
        assert.equal(await handling.locator("input:checked").count(), 3);
        assert.ok(
          await page
            .getByRole("button", { name: "Create rescue batch" })
            .isEnabled(),
        );
        await handling.locator("input").first().uncheck();
        assert.ok(
          await page
            .getByRole("button", { name: "Create rescue batch" })
            .isDisabled(),
        );
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        console.log(
          "PASS donor: blank/zero servings stay selected; mixed handling; missing handling blocked; mobile width",
        );
      }
      assert.deepEqual(errors, []);
      console.log("PASS " + role + ": no meal finder link in staff portal");
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
