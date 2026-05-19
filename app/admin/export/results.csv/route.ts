// quick-260519-jpr Wave 3 - GM-only ranking CSV export.
// Mirror of app/admin/export/players.csv/route.ts but gated by the
// pitch mode state machine: requires state='closed' OR results published.
// Pre-publish during 'off'/'live', a 403 is returned with a French message
// so the GameMaster knows why the link is locked.
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { dictionaries } from "@/lib/i18n";
import { getCurrentPitchModeState } from "@/lib/pitch-mode";
import { computeRanking } from "@/lib/results";
import { hasSupabaseEnv } from "@/lib/supabase-status";

export const dynamic = "force-dynamic";

const t = dictionaries.fr;

const COLUMNS = [
  "rank",
  "team",
  "idea",
  "pitch_avg",
  "score_project",
  "combined",
  "juror_count",
];

export async function GET() {
  // Demo mode: emit header-only CSV (same convention as players.csv).
  if (!hasSupabaseEnv()) {
    return csvResponse("results-digi-hackathon.csv", COLUMNS.join(",") + "\r\n");
  }

  const role = await getCurrentRole();
  if (role !== "game_master") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Gate: state must be 'closed' OR results must already be published.
  const { state, publishedAt } = await getCurrentPitchModeState();
  const gateOpen = state === "closed" || publishedAt !== null;
  if (!gateOpen) {
    return new NextResponse(t.results_export_csv_gate_message, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { rows } = await computeRanking({ requesterRole: "game_master" });

  const exportRows = rows.map((r) => ({
    rank: r.rank,
    team: r.player.name,
    idea: r.player.idea ?? "",
    pitch_avg: r.pitchAvg.toFixed(2),
    score_project: r.scoreProject.toFixed(2),
    combined: r.combined.toFixed(2),
    juror_count: r.pitchJurorCount,
  }));

  const body =
    exportRows.length === 0
      ? COLUMNS.join(",") + "\r\n"
      : toCsv(
          exportRows as unknown as Array<Record<string, string | number | null | undefined>>,
          COLUMNS,
        );

  return csvResponse("results-digi-hackathon.csv", body);
}
