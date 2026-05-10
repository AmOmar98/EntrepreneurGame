// T3X-EXPANSION wave 4 / plan 12-11 — GameMaster CSV export of MoSCoW cards.
// GET /api/export/moscow/[deliverableId].csv
// Auth-gated game_master via lib/auth.ts:getCurrentRole. Demo mode -> header-only CSV.
// Pattern aligned on app/admin/export/players.csv/route.ts (auth-gated, dynamic =
// force-dynamic, demo mode safe). Reuse lib/csv.ts:toCsv + csvResponse.
//
// Note: Next.js 15 type validator treats segments with a dot suffix as having no
// dynamic params (ParamMap = {}). We parse the deliverableId from the URL pathname
// rather than from the typed `params` argument to keep the URL shape contract.
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentRole } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLUMNS = [
  "team_slug",
  "team_name",
  "bucket",
  "ord",
  "feature",
  "pourquoi",
  "contrainte",
  "created_at",
];

const BUCKET_ORDER: Record<string, number> = {
  must: 1,
  should: 2,
  could: 3,
  wont: 4,
};

function headerOnly(deliverableId: string): Response {
  return csvResponse(`moscow_${deliverableId}.csv`, COLUMNS.join(",") + "\r\n");
}

// Extract deliverableId from pathname `/api/export/moscow/<id>.csv`.
function deliverableIdFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const last = pathname.split("/").filter(Boolean).pop() ?? "";
    return last.replace(/\.csv$/i, "");
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const deliverableId = deliverableIdFromUrl(request.url);

  // Demo mode: bypass role gate and emit header-only CSV so the route stays
  // demoable without backend (aligned on players.csv pattern).
  if (!hasSupabaseEnv()) {
    return headerOnly(deliverableId);
  }

  // Supabase mode: strict GM gate (defense-in-depth alongside RLS).
  const role = await getCurrentRole();
  if (role !== "game_master") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return headerOnly(deliverableId);
  }

  // JOIN moscow_cards + players (alias on project_id) for team_slug + team_name.
  const { data, error } = await supabase
    .from("moscow_cards")
    .select(
      "bucket, ord, feature, pourquoi, contrainte, created_at, players:project_id(slug, name)",
    )
    .eq("deliverable_template_id", deliverableId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return headerOnly(deliverableId);
  }

  type Row = {
    bucket: string;
    ord: number;
    feature: string;
    pourquoi: string;
    contrainte: string;
    created_at: string;
    players: { slug: string; name: string } | null;
  };

  const rows = (data as unknown as Row[])
    .map((r) => ({
      team_slug: r.players?.slug ?? "",
      team_name: r.players?.name ?? "",
      bucket: r.bucket,
      ord: r.ord,
      feature: r.feature,
      pourquoi: r.pourquoi,
      contrainte: r.contrainte,
      created_at: r.created_at,
    }))
    .sort((a, b) => {
      const t = a.team_slug.localeCompare(b.team_slug);
      if (t !== 0) return t;
      const bk = (BUCKET_ORDER[a.bucket] ?? 99) - (BUCKET_ORDER[b.bucket] ?? 99);
      if (bk !== 0) return bk;
      return a.ord - b.ord;
    });

  const body =
    rows.length === 0
      ? COLUMNS.join(",") + "\r\n"
      : toCsv(
          rows as unknown as Array<Record<string, string | number | null | undefined>>,
          COLUMNS,
        );

  return csvResponse(`moscow_${deliverableId}.csv`, body);
}
