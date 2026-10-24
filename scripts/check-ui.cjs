const { chromium } = require("../frontend/node_modules/playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
require("../backend/node_modules/dotenv").config({
  path: path.join(__dirname, "../backend/.env"),
  quiet: true,
});
(async () => {
  const browser = await chromium.launch(
    process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH, headless: true }
      : { channel: "chrome", headless: true },
  );
  const output = path.join(__dirname, "../.screenshots");
  await fs.mkdir(output, { recursive: true });
  const errors = [];
  let checked = 0;
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://localhost:5173");
    await page.getByRole("heading", { name: /Good food/ }).waitFor();
    await page.screenshot({
      path: path.join(output, "landing.png"),
      fullPage: true,
      animations: "disabled",
    });
    checked++;
    await context.close();
    const roles = [
      [
        "donor",
        "donor@example.com",
        "Demo123!",
        ["Event planning", "Leftover triage", "Chain of custody"],
      ],
      [
        "center",
        "ngo@example.com",
        "Demo123!",
        ["My facility", "Intake & feedback", "Chain of custody"],
      ],
      [
        "driver",
        "volunteer@example.com",
        "Demo123!",
        ["My handoffs", "Chain of custody"],
      ],
      [
        "central",
        process.env.SUPER_ADMIN_EMAIL || "admin@samrit.local",
        process.env.SUPER_ADMIN_PASSWORD || "SecureAdmin123!",
        [
          "Dispatch & routes",
          "Distribution centers",
          "Private quality reviews",
          "Chain of custody",
        ],
      ],
    ];
    for (const [role, email, password, tabs] of roles) {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const tab = await ctx.newPage();
      tab.on("pageerror", (e) => errors.push(e.message));
      await tab.goto("http://localhost:5173/login");
      await tab.getByLabel("Email address").fill(email);
      await tab.getByLabel("Password", { exact: true }).fill(password);
      await tab.getByRole("button", { name: "Sign in", exact: true }).click();
      await tab
        .getByRole("heading", { name: "Recent rescue batches" })
        .waitFor();
      await tab.screenshot({
        path: path.join(output, `${role}.png`),
        fullPage: true,
        animations: "disabled",
      });
      checked++;
      for (const label of tabs) {
        await tab.getByRole("button", { name: label, exact: true }).click();
        await tab.waitForFunction(
          () =>
            !document.body.innerText.includes("Loading your recovery network"),
        );
        assert.equal(await tab.locator("main [role=alert]").count(), 0);
        await tab.screenshot({
          path: path.join(
            output,
            `${role}-${label.toLowerCase().replaceAll(/[^a-z]+/g, "-")}.png`,
          ),
          fullPage: true,
          animations: "disabled",
        });
        checked++;
      }
      await tab.setViewportSize({ width: 390, height: 844 });
      await tab.screenshot({
        path: path.join(output, `${role}-mobile.png`),
        fullPage: true,
        animations: "disabled",
      });
      const overflows = await tab.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2,
      );
      assert.equal(
        overflows,
        false,
        `${role} has horizontal overflow on mobile`,
      );
      checked++;
      await ctx.close();
    }
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const tab = await ctx.newPage();
    tab.on("pageerror", (e) => errors.push(e.message));
    await tab.goto("http://localhost:5173/consumer");
    await tab.getByRole("heading", { name: /A good meal/ }).waitFor();
    await tab.getByRole("button", { name: "Select your allergens", exact: true }).click();
    await tab.getByRole("checkbox", { name: "Wheat", exact: true }).check();
    await tab.keyboard.press("Escape");
    assert.equal(
      await tab
        .getByRole("heading", {
          name: "East Village Community Table",
          exact: true,
        })
        .count(),
      0,
    );
    await tab.getByRole("link", { name: "Already at a place? Check in" }).click();
    await tab.getByLabel("Entry QR code").fill("samrit:visit:east-village:entry");
    await tab.getByRole("button", { name: "Record entry code" }).click();
    await tab.getByRole("button", { name: "Leave a private anonymous review" }).click();
    await tab.getByLabel("Exit QR code").fill("samrit:visit:east-village:exit");
    await tab.getByRole("button", { name: "Record exit code" }).click();
    await tab.getByRole("button", { name: "Good experience", exact: true }).click();
    await tab.getByRole("button", { name: "Preview private review", exact: true }).click();
    await tab.getByRole("status").filter({ hasText: "Review preview complete" }).waitFor();
    await tab.screenshot({
      path: path.join(output, "consumer-mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    checked++;
    await ctx.close();
    assert.deepEqual(errors, []);
    console.log(
      `PASS: ${checked} browser views/checks, all four authenticated workspaces, mobile layouts, consumer filtering and review preview. No page errors.`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
