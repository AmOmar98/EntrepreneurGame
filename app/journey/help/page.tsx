// Phase 10 / Section 11 — Coup de pouce (Player bloque).
// Route /journey/help — server-rendered.

import { AppShell } from "@/components/app-shell";
import { StuckHelp, type StuckTimelineItem } from "@/components/help/StuckHelp";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export const metadata = {
  title: t.help_stuck_kicker,
};

// Demo-mode timeline (real data hookup deferred to follow-up; lib/journey.ts
// recentPlayerActions helper would feed this in Supabase mode).
const DEMO_TIMELINE: StuckTimelineItem[] = [];

export default function StuckHelpPage() {
  return (
    <AppShell role="player">
      <main className="main">
        <StuckHelp timeline={DEMO_TIMELINE} />
      </main>
    </AppShell>
  );
}
