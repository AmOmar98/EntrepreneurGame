// Phase 4 / Plan 04 - Minimal CSV serializer + Response helper for export route handlers.
// Re-introduced after DATA-06 (Phase 1) deletion: ADMIN-04 needs RFC 4180 quoting + a
// small Response wrapper. Kept intentionally tiny - one consumer today
// (`app/admin/export/players.csv/route.ts`).

type CsvCell = string | number | null | undefined;
type CsvRow = Record<string, CsvCell>;

const NEWLINE = "\r\n";

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "number" ? String(value) : value;
  // RFC 4180: quote when value contains comma, double-quote, CR or LF.
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(rows: CsvRow[], columns?: string[]): string {
  if (rows.length === 0 && !columns) return "";
  const cols = columns ?? Object.keys(rows[0] ?? {});
  const header = cols.map((c) => escapeCell(c)).join(",");
  const lines: string[] = [header];
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCell(row[c])).join(","));
  }
  return lines.join(NEWLINE) + NEWLINE;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// ---------------------------------------------------------------------------
// Inline self-tests (no test runner configured in this repo).
// Run via:  npx tsx lib/csv.ts
// ---------------------------------------------------------------------------

function runSelfTests(): void {
  const cases: Array<[string, () => void]> = [
    [
      "empty rows + no columns -> empty string",
      () => {
        const out = toCsv([]);
        if (out !== "") throw new Error(`expected '' got '${out}'`);
      },
    ],
    [
      "value with comma is quoted",
      () => {
        const out = toCsv([{ a: "x,y", b: "z" }]);
        const expected = "a,b" + NEWLINE + '"x,y",z' + NEWLINE;
        if (out !== expected) throw new Error(`expected ${JSON.stringify(expected)} got ${JSON.stringify(out)}`);
      },
    ],
    [
      'value with double-quote is escaped (He said "hi")',
      () => {
        const out = toCsv([{ a: 'He said "hi"' }]);
        const expected = "a" + NEWLINE + '"He said ""hi"""' + NEWLINE;
        if (out !== expected) throw new Error(`expected ${JSON.stringify(expected)} got ${JSON.stringify(out)}`);
      },
    ],
    [
      "null becomes empty cell",
      () => {
        const out = toCsv([{ a: null, b: "x" }]);
        const expected = "a,b" + NEWLINE + ",x" + NEWLINE;
        if (out !== expected) throw new Error(`expected ${JSON.stringify(expected)} got ${JSON.stringify(out)}`);
      },
    ],
  ];

  let failed = 0;
  for (const [label, fn] of cases) {
    try {
      fn();
      console.log(`  ok  ${label}`);
    } catch (e) {
      failed++;
      console.error(`  FAIL ${label}: ${(e as Error).message}`);
    }
  }
  if (failed > 0) {
    console.error(`${failed}/${cases.length} test(s) failed`);
    process.exit(1);
  }
  console.log(`${cases.length}/${cases.length} test(s) passed`);
}

// Detect "run as script" in a way that works under tsx (ESM) and ts-node (CJS).
const invokedAsScript =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === "string" &&
  /[\\/]lib[\\/]csv\.ts$/.test(process.argv[1]);

if (invokedAsScript) {
  runSelfTests();
}
