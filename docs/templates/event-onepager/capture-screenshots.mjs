// Capture screenshots PROD pour mockup one-pager v2
// Usage : node .planning/quick/260519-onepagers/v2-simple/capture-screenshots.mjs
//
// Login P01 sur PROD, capture /journey desktop 1280x800 + mobile 390x844
// Sortie : v2-simple/assets/screenshot-desktop.png + screenshot-mobile.png

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(here, "assets");

const URL_PROD = "https://entrepreneur-game-six.vercel.app";
const EMAIL = "team-simock@digi.uemf.ma";
const PWD = "vgK5BppsURNL";

const browser = await chromium.launch();

async function login(page) {
  await page.goto(`${URL_PROD}/login?role=player`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PWD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(journey|onboarding)/, { timeout: 15000 });
}

// --- DESKTOP 1280x800 ---
console.log("> Desktop 1280x800…");
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await login(page);
  // If onboarding, skip via direct nav (player won't be redirected back if level allows)
  if (page.url().includes("/onboarding")) {
    console.log("  (onboarding page reached, capturing onboarding instead of journey)");
  } else {
    await page.goto(`${URL_PROD}/journey`, { waitUntil: "networkidle" });
  }
  await page.waitForTimeout(1500);
  const dest = join(assetsDir, "screenshot-desktop.png");
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`  ✓ ${dest}`);
  await ctx.close();
}

// --- MOBILE 390x844 (iPhone 13) ---
console.log("> Mobile 390x844…");
{
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
  });
  const page = await ctx.newPage();
  await login(page);
  if (page.url().includes("/onboarding")) {
    console.log("  (onboarding page reached, capturing onboarding instead of journey)");
  } else {
    await page.goto(`${URL_PROD}/journey`, { waitUntil: "networkidle" });
  }
  await page.waitForTimeout(1500);
  const dest = join(assetsDir, "screenshot-mobile.png");
  await page.screenshot({ path: dest, fullPage: false });
  console.log(`  ✓ ${dest}`);
  await ctx.close();
}

await browser.close();
console.log("\nDone.");
