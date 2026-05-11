// scripts/smoke-http.mjs
// Usage: node scripts/smoke-http.mjs
// Fetch GET sur prod URLs publiques, verifie status 2xx/3xx + marker HTML.
const TARGETS = [
  { url: "https://entrepreneur-game-six.vercel.app/login", marker: "Entrepreneur Game" },
  { url: "https://entrepreneur-game-six.vercel.app/", marker: null },
];

let failed = 0;
for (const t of TARGETS) {
  try {
    const res = await fetch(t.url, { redirect: "manual" });
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) {
      console.error(`[smoke-http] ${t.url}: FAIL status=${res.status}`);
      failed++;
      continue;
    }
    if (t.marker) {
      const html = await res.text();
      if (!html.includes(t.marker)) {
        console.error(`[smoke-http] ${t.url}: FAIL marker '${t.marker}' missing`);
        failed++;
        continue;
      }
    }
    console.log(`[smoke-http] ${t.url}: OK status=${res.status}`);
  } catch (e) {
    console.error(`[smoke-http] ${t.url}: FAIL ${e.message}`);
    failed++;
  }
}
process.exit(failed === 0 ? 0 : 1);
