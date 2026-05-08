// Phase 4 / Plan 04 - GET /admin/export/players.csv (ADMIN-04).
// Streams a CSV with one row per Player in the current event, gated to game_master.
// In demo mode (no Supabase env) the underlying accessor returns [] and we still emit
// a valid header-only CSV so partners testing the URL never see a crash.
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth";
import { getPlayersExportRows } from "@/lib/admin-export";
import { toCsv, csvResponse } from "@/lib/csv";
import { hasSupabaseEnv } from "@/lib/supabase-status";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "team_slug",
  "team_name",
  "current_level",
  "status",
  "score_project",
  "score_engagement",
  "submissions_count",
  "validated_count",
  "leader_email",
  "member_emails",
];

export async function GET() {
  // Demo mode (no Supabase env): bypass role gate and emit a valid header-only CSV
  // so the route stays demoable without backend (per must_have: "En mode demo...
  // reponse 200 avec uniquement la ligne d'en-tete").
  if (hasSupabaseEnv()) {
    const role = await getCurrentRole();
    if (role !== "game_master") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const rows = await getPlayersExportRows();
  const body =
    rows.length === 0
      ? COLUMNS.join(",") + "\r\n"
      : toCsv(
          rows as unknown as Array<Record<string, string | number | null | undefined>>,
          COLUMNS,
        );

  return csvResponse("players.csv", body);
}
