#!/usr/bin/env node
/**
 * scripts/provision-ideawave-bootcamp.mjs
 *
 * Inspects or generates SQL synchronization statements for the
 * Bootcamp Idea'Wave (16 & 17 November 2026) event (`ideawave-bootcamp-nov-2026`).
 *
 * Usage:
 *   node scripts/provision-ideawave-bootcamp.mjs --status
 *   node scripts/provision-ideawave-bootcamp.mjs --print-sql
 */

import fs from "node:fs";
import path from "node:path";

const SEED_SQL_PATH = path.resolve("database/seed_ideawave_bootcamp_nov2026.sql");
const DOC_PATH = path.resolve("docs/IDEAWAVE_BOOTCAMP_16_17_NOV.md");
const ARCHIVE_MANIFEST_PATH = path.resolve(
  ".planning/ops-ledger/archives/ARCHIVE-20261111-pre-ideawave.md",
);

const IDEAWAVE_META = {
  eventId: "7d553162-1c1e-44d9-9845-9f7b1c58f619",
  slug: "ideawave-bootcamp-nov-2026",
  name: "Bootcamp Idea'Wave — 16 & 17 Novembre 2026",
  organizationId: "588bc094-d46c-472d-8c91-023738026be4",
  cohortSlug: "cohorte-ideawave-nov-2026",
  startsAt: "2026-11-16T08:30:00+01:00",
  endsAt: "2026-11-17T18:00:00+01:00",
};

const args = process.argv.slice(2);

if (args.includes("--print-sql")) {
  if (!fs.existsSync(SEED_SQL_PATH)) {
    console.error(`Missing seed SQL file: ${SEED_SQL_PATH}`);
    process.exit(1);
  }
  process.stdout.write(fs.readFileSync(SEED_SQL_PATH, "utf8"));
  process.exit(0);
}

console.log("=== Bootcamp Idea'Wave (16 & 17 Nov 2026) Provisioning Status ===");
console.log(JSON.stringify(IDEAWAVE_META, null, 2));
console.log("");
console.log(
  `[SQL Seed]         ${fs.existsSync(SEED_SQL_PATH) ? "READY" : "MISSING"} (${SEED_SQL_PATH})`,
);
console.log(
  `[Runbook & Guide]  ${fs.existsSync(DOC_PATH) ? "READY" : "MISSING"} (${DOC_PATH})`,
);
console.log(
  `[Archive Ledger]   ${fs.existsSync(ARCHIVE_MANIFEST_PATH) ? "READY" : "MISSING"} (${ARCHIVE_MANIFEST_PATH})`,
);
