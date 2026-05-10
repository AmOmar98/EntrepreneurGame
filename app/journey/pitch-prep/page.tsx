// Phase 10 / Section 10 — Pitch prep H-2 (Player J-1 pitch).
// Server-rendered shell — fetches PitchPrepData and hands off to client
// component. R1 gate : pitch_order_published_at applied at helper level.

import { AppShell } from "@/components/app-shell";
import { PitchPrep } from "@/components/pitch-prep/PitchPrep";
import { getPitchPrep, type PitchPrepData } from "@/lib/pitch-prep";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export const metadata = {
  title: t.pitch_prep_title,
};

export default function PitchPrepPage() {
  // Demo-mode placeholder : pitch order not yet published. Real data
  // hookup (events.pitch_order_json + pitch_order_published_at) in
  // Supabase mode requires server action / RLS-aware query — deferred
  // to follow-up since pitch order is GameMaster-only mutation.
  const prep: PitchPrepData = getPitchPrep({
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
