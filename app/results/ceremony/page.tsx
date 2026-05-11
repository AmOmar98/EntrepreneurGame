import { redirect } from "next/navigation";
import { ResultsCeremonyScreen } from "@/components/results-ceremony-screen";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { computeRanking } from "@/lib/results";
import { hasSupabaseEnv } from "@/lib/supabase-status";

// Design v2 (polish/design-v2-match V8) — Closing ceremony screen.
// GM-only. Reveals top 3 of the published ranking with podium animation
// and partner logo footer. Linked from /results (GM view) via the
// "Mode cérémonie →" button.
export default async function CeremonyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role !== "game_master") {
    redirect("/results");
  }

  if (!hasSupabaseEnv()) {
    return <ResultsCeremonyScreen podium={[]} />;
  }

  const ranking = await computeRanking();
  // Take top 3 by combined score; rank derived from sorted order (ranking.rows
  // is already sorted with dense ranking applied).
  const podium = ranking.rows.slice(0, 3).map((row, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    teamName: row.player.name,
    idea: row.player.idea ?? null,
    combined: row.combined,
  }));

  return <ResultsCeremonyScreen podium={podium} />;
}
