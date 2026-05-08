export function toCsv<T extends Record<string, unknown>>(rows: T[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const raw = row[header] ?? "";
          const value = String(raw).replaceAll('"', '""');
          return /[",\n\r]/.test(value) ? `"${value}"` : value;
        })
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
