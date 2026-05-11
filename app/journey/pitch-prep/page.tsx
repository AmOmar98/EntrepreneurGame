// Phase 10 / Section 10 — Pitch prep H-2 (Player J-1 pitch).
// Server-rendered shell — fetches PitchPrepData and hands off to client
// component. R1 gate : pitch_order_published_at applied at helper level.

import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PitchPrep } from "@/components/pitch-prep/PitchPrep";
import { getCurrentUser } from "@/lib/auth";
import {
  getPitchPrep,
  getPitchPrepForUser,
  type PitchPrepData,
} from "@/lib/pitch-prep";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export const metadata = {
  title: t.pitch_prep_title,
};

export default async function PitchPrepPage() {
  // Dual-mode demo guard (CLAUDE.md guard #3 + memory feedback_dual_mode_demo_guard).
  // Supabase mode : resolve user, fetch real slot via player_members + events.
  // Demo mode : render placeholder shape (slot not published).
  const user = hasSupabaseEnv() ? await getCurrentUser() : null;
  if (hasSupabaseEnv() && !user) {
    redirect("/login");
  }

  const prep: PitchPrepData = user
    ? await getPitchPrepForUser(user.id)
    : getPitchPrep({
        playerId: "demo",
        pitchOrderJson: null,
        pitchOrderPublishedAt: null,
      });

  return (
    <AppShell role="player">
      <main className="main">
        <PitchPrep prep={prep} />
      </main>
    </AppShell>
  );
}
