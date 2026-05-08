// Phase 4 / Plan 02 - Admin CSV import: pure parser + idempotent helpers.
//
// This module is intentionally Supabase-free: the importPlayersCsv server
// action (app/actions.ts) consumes parseCsv + dedupeCsvRows + slugifyTeam to
// orchestrate DB writes. Keeping these helpers pure makes them unit-testable.
//
// No test runner is configured in this repo (per CLAUDE.md). The bottom of
// this file contains an `if (require.main === module)` block that runs the
// six expected test cases via node:assert. Verify with:
//   npx tsx lib/admin-import.ts
// Expected output: PASS lines for tests 1..6 and "ALL TESTS PASSED".

// ============================================================================
// Public types
// ============================================================================

export type CsvRow = {
  teamName: string;
  projectName: string;
  projectPitch: string;
  leaderEmail: string;
  memberEmails: string[]; // semicolon-separated, trimmed, lowercased
};

export type CsvParseError = { line: number; email?: string; reason: string };

export type ImportReport = {
  created: number;
  alreadyExisted: number;
  membersAdded: number;
  invitesSent: number;
  invitesSkipped: number; // service role missing
  errors: { line?: number; email?: string; reason: string }[];
};

// ============================================================================
// Constants
// ============================================================================

const REQUIRED_COLUMNS = [
  "team_name",
  "project_name",
  "project_pitch",
  "leader_email",
  "member_emails",
] as const;

// RFC 5322-ish pragmatic email check. Good enough for pilot CSVs.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// Slugify
// ============================================================================

/**
 * Returns lowercase kebab-case base slug for a team name.
 * - Strips diacritics
 * - Replaces non-alphanum runs with `-`
 * - Trims leading/trailing dashes
 *   "Equipe Alpha 1!" -> "equipe-alpha-1"
 */
export function slugifyTeam(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// CSV tokenizer (simple RFC 4180 quote handling)
// ============================================================================

/**
 * Split a single CSV record line into fields, honoring double-quote escaping.
 * Note: callers must already have grouped quoted multi-line records — but our
 * pilot CSVs are single-line per record so we treat newline as record sep.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

// ============================================================================
// parseCsv
// ============================================================================

/**
 * Parses CSV text. Required header (any order):
 *   team_name, project_name, project_pitch, leader_email, member_emails
 *
 * - Skips blank lines.
 * - Tolerates trailing newline.
 * - Drops rows with invalid leader_email (records error).
 * - member_emails optional, semicolon-separated.
 */
export function parseCsv(text: string): { rows: CsvRow[]; errors: CsvParseError[] } {
  const errors: CsvParseError[] = [];
  const rows: CsvRow[] = [];

  if (!text || text.trim().length === 0) {
    errors.push({ line: 0, reason: "empty CSV" });
    return { rows, errors };
  }

  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Find first non-blank line as header.
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) {
    errors.push({ line: 0, reason: "empty CSV" });
    return { rows, errors };
  }

  const header = splitCsvLine(lines[headerIdx]).map((h) => h.toLowerCase());
  const colIndex: Record<(typeof REQUIRED_COLUMNS)[number], number> = {
    team_name: -1,
    project_name: -1,
    project_pitch: -1,
    leader_email: -1,
    member_emails: -1,
  };
  for (const col of REQUIRED_COLUMNS) {
    const idx = header.indexOf(col);
    if (idx < 0) {
      errors.push({ line: headerIdx + 1, reason: `missing column: ${col}` });
    }
    colIndex[col] = idx;
  }
  if (errors.length > 0) {
    return { rows, errors };
  }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim().length === 0) continue;
    const fields = splitCsvLine(raw);
    const lineNum = i + 1;

    const teamName = (fields[colIndex.team_name] ?? "").trim();
    const projectName = (fields[colIndex.project_name] ?? "").trim();
    const projectPitch = (fields[colIndex.project_pitch] ?? "").trim();
    const leaderEmailRaw = (fields[colIndex.leader_email] ?? "").trim().toLowerCase();
    const memberEmailsRaw = (fields[colIndex.member_emails] ?? "").trim();

    if (!teamName) {
      errors.push({ line: lineNum, reason: "empty team_name" });
      continue;
    }
    if (!EMAIL_RE.test(leaderEmailRaw)) {
      errors.push({ line: lineNum, reason: `invalid leader_email: "${leaderEmailRaw}"` });
      continue;
    }

    const memberEmails: string[] = [];
    if (memberEmailsRaw.length > 0) {
      for (const part of memberEmailsRaw.split(";")) {
        const e = part.trim().toLowerCase();
        if (!e) continue;
        if (!EMAIL_RE.test(e)) {
          errors.push({ line: lineNum, email: e, reason: `invalid member email: "${e}"` });
          continue;
        }
        if (memberEmails.includes(e)) continue;
        memberEmails.push(e);
      }
    }

    rows.push({
      teamName,
      projectName,
      projectPitch,
      leaderEmail: leaderEmailRaw,
      memberEmails,
    });
  }

  return { rows, errors };
}

// ============================================================================
// dedupeCsvRows
// ============================================================================

/**
 * Dedupes by leader_email (case-insensitive), keeping first occurrence.
 */
export function dedupeCsvRows(rows: CsvRow[]): CsvRow[] {
  const seen = new Set<string>();
  const out: CsvRow[] = [];
  for (const r of rows) {
    const key = r.leaderEmail.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ============================================================================
// Inline test runner (fallback when no test framework is configured)
// ============================================================================

/* istanbul ignore next */
async function runInlineTests(): Promise<void> {
  // Plain helpers (no node:assert) to avoid TS2775 "explicit type annotation
  // required for assertion functions" issues with dynamic imports.
  const eq = (actual: unknown, expected: unknown, msg?: string) => {
    if (actual !== expected) {
      throw new Error(
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}${msg ? " - " + msg : ""}`,
      );
    }
  };
  const deepEq = (actual: unknown, expected: unknown, msg?: string) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}${msg ? " - " + msg : ""}`,
      );
    }
  };
  const truthy = (cond: boolean, msg?: string) => {
    if (!cond) throw new Error(msg ?? "expected truthy");
  };
  const matches = (str: string, re: RegExp, msg?: string) => {
    if (!re.test(str)) {
      throw new Error(`expected ${str} to match ${re}${msg ? " - " + msg : ""}`);
    }
  };

  let pass = 0;
  let fail = 0;
  const log = (label: string, ok: boolean, detail?: string) => {
    if (ok) {
      pass++;
      console.log(`PASS  ${label}`);
    } else {
      fail++;
      console.log(`FAIL  ${label}${detail ? " - " + detail : ""}`);
    }
  };

  // Test 1: parse valid 3-row CSV
  {
    const csv = [
      "team_name,project_name,project_pitch,leader_email,member_emails",
      "Alpha,Idea A,Pitch A,a@x.io,b@x.io;c@x.io",
      "Beta,Idea B,Pitch B,d@x.io,",
      "Gamma,Idea C,Pitch C,e@x.io,f@x.io",
    ].join("\n");
    const r = parseCsv(csv);
    try {
      eq(r.rows.length, 3, `rows.length=${r.rows.length}`);
      eq(r.errors.length, 0, `errors=${JSON.stringify(r.errors)}`);
      eq(r.rows[0].leaderEmail, "a@x.io");
      deepEq(r.rows[0].memberEmails, ["b@x.io", "c@x.io"]);
      deepEq(r.rows[1].memberEmails, []);
      log("Test 1: valid 3-row CSV", true);
    } catch (e) {
      log("Test 1: valid 3-row CSV", false, (e as Error).message);
    }
  }

  // Test 2: missing header column
  {
    const csv = [
      "team_name,project_name,leader_email,member_emails",
      "Alpha,Idea A,a@x.io,",
    ].join("\n");
    const r = parseCsv(csv);
    try {
      truthy(r.errors.length >= 1, "expected error");
      matches(r.errors[0].reason, /missing column/i);
      log("Test 2: missing header column", true);
    } catch (e) {
      log("Test 2: missing header column", false, (e as Error).message);
    }
  }

  // Test 3: invalid leader_email
  {
    const csv = [
      "team_name,project_name,project_pitch,leader_email,member_emails",
      "Alpha,Idea,Pitch,not-an-email,",
      "Beta,Idea,Pitch,ok@x.io,",
    ].join("\n");
    const r = parseCsv(csv);
    try {
      eq(r.rows.length, 1, `rows.length=${r.rows.length}`);
      truthy(r.errors.some((e) => /invalid leader_email/i.test(e.reason)));
      log("Test 3: invalid leader_email -> dropped + error", true);
    } catch (e) {
      log("Test 3: invalid leader_email -> dropped + error", false, (e as Error).message);
    }
  }

  // Test 4: quoted field with comma
  {
    const csv = [
      "team_name,project_name,project_pitch,leader_email,member_emails",
      `Alpha,"Project, X","Pitch, with comma",a@x.io,`,
    ].join("\n");
    const r = parseCsv(csv);
    try {
      eq(r.errors.length, 0, JSON.stringify(r.errors));
      eq(r.rows.length, 1);
      eq(r.rows[0].projectName, "Project, X");
      eq(r.rows[0].projectPitch, "Pitch, with comma");
      log("Test 4: quoted fields with embedded commas", true);
    } catch (e) {
      log("Test 4: quoted fields with embedded commas", false, (e as Error).message);
    }
  }

  // Test 5: dedupe by leader_email (case-insensitive) keeps first
  {
    const rows: CsvRow[] = [
      {
        teamName: "Alpha",
        projectName: "A",
        projectPitch: "P",
        leaderEmail: "a@x.io",
        memberEmails: [],
      },
      {
        teamName: "Alpha-bis",
        projectName: "A2",
        projectPitch: "P2",
        leaderEmail: "A@x.io",
        memberEmails: [],
      },
    ];
    const out = dedupeCsvRows(rows);
    try {
      eq(out.length, 1);
      eq(out[0].teamName, "Alpha");
      log("Test 5: dedupeCsvRows case-insensitive, keep first", true);
    } catch (e) {
      log("Test 5: dedupeCsvRows case-insensitive, keep first", false, (e as Error).message);
    }
  }

  // Test 6: slugify
  {
    try {
      eq(slugifyTeam("Equipe Alpha 1!"), "equipe-alpha-1");
      eq(slugifyTeam("  Eqüipe  Bêta  "), "equipe-beta");
      log("Test 6: slugifyTeam normalizes diacritics + punctuation", true);
    } catch (e) {
      log("Test 6: slugifyTeam normalizes diacritics + punctuation", false, (e as Error).message);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) {
    process.exit(1);
  }
  console.log("ALL TESTS PASSED");
}

// CommonJS-compatible "main module" check — `package.json` declares "type": "commonjs",
// and tsx supports `require.main === module` in this mode.
declare const require: NodeJS.Require | undefined;
if (typeof require !== "undefined" && require.main === module) {
  runInlineTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
