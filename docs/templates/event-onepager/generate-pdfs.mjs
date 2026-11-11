// Génère 10 PDF A4 portrait depuis les one-pagers HTML
// Usage : node .planning/quick/260519-onepagers/generate-pdfs.mjs
//
// Sortie : .planning/quick/260519-onepagers/pXX-slug.pdf (à côté de chaque .html)
// Dépendance : playwright (déjà dans devDeps via "smoke": "playwright test").

import { chromium } from "playwright";
import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const htmlFiles = (await readdir(here))
  .filter((f) => f.endsWith(".html"))
  .sort();

if (htmlFiles.length === 0) {
  console.error("Aucun fichier .html trouvé dans", here);
  process.exit(1);
}

console.log(`> ${htmlFiles.length} fichiers HTML détectés. Lancement Chromium headless…`);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

let okCount = 0;
for (const html of htmlFiles) {
  const htmlPath = join(here, html);
  const pdfPath = join(here, html.replace(/\.html$/, ".pdf"));
  const url = pathToFileURL(htmlPath).href;

  await page.goto(url, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "10mm", right: "12mm", bottom: "10mm", left: "12mm" },
  });

  console.log(`  ✓ ${html.padEnd(28)} → ${pdfPath.split(/[\\/]/).pop()}`);
  okCount++;
}

await browser.close();
console.log(`\n${okCount}/${htmlFiles.length} PDF générés dans ${here}`);
