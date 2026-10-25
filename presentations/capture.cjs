const { chromium } = require('../frontend/node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs/promises');
const output = path.join(__dirname, 'assets');
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => localStorage.setItem('samrit-theme', 'light'));
    const page = await ctx.newPage();
    await page.goto('http://localhost:5173/consumer');
    await page.locator('article.sr-consumer-venue').first().waitFor();
    await page.waitForFunction(() => { const tiles = [...document.querySelectorAll('.leaflet-tile')]; return tiles.length > 0 && tiles.every(img => img.complete && img.naturalWidth > 0); }, undefined, { timeout: 20000 }).catch(() => {});
    await page.getByRole('heading', { name: 'Find a place that works for you.' }).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 40));
    await page.screenshot({ path: path.join(output, 'consumer.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open meal voice assistant' }).click();
    await page.getByRole('button', { name: 'Enable assistant' }).click();
    await page.getByRole('button', { name: 'Mute spoken replies' }).click();
    await page.getByLabel('Assistant message').fill('Avoid peanuts and find hot meals in East Village');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm action' }).waitFor({ timeout: 60000 });
    await page.screenshot({ path: path.join(output, 'voice-mobile.png') });
    await ctx.close();
    for (const [name, email, password, view] of [
      ['donor', 'donor@example.com', 'Demo123!', 'events'],
      ['triage', 'donor@example.com', 'Demo123!', 'triage'],
      ['center', 'ngo@example.com', 'Demo123!', 'center'],
      ['admin', 'admin.demo@example.com', 'DemoAdmin123!', 'dispatch'],
      ['driver', 'driver.maya@example.com', 'DemoDriver123!', 'driver'],
      ['reviews', 'admin.demo@example.com', 'DemoAdmin123!', 'moderation'],
    ]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
      const response = await (await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).json();
      const auth = response.data || response;
      if (!auth.token) throw Error('Demo login failed for ' + name);
      await context.addInitScript(token => { localStorage.setItem('token', token); localStorage.setItem('samrit-theme', 'light'); }, auth.token);
      const tab = await context.newPage();
      await tab.goto('http://localhost:5173/dashboard?view=' + view);
      await tab.locator('header.sr-topbar').waitFor();
      await tab.waitForTimeout(500);
      await tab.screenshot({ path: path.join(output, name + '.png') });
      await context.close();
    }
    console.log('Captured presentation screenshots from the running app.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
