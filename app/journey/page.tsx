// Phase 2 / Plan 02 - Player journey page.
// Server component. Resolves the connected user, gates by role, and renders
// the header / today's missions timeline / today's deliverables list.
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { JourneyDeliverables } from "@/components/journey-deliverables";
import { JourneyHeader } from "@/components/journey-header";
import { JourneyTimeline } from "@/components/journey-timeline";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { getJourneyData } from "@/lib/journey";

const t = dictionaries.fr;

export default async function JourneyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentRole();
  if (role && role !== "player") {
    redirect(pathForRole(role));
  }

  const data = await getJourneyData(user.id);

  if (data.empty || !data.player) {
    return (
      <AppShell role="player">
        <main style={{ padding: 24, maxWidth: 960 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
            {t.journey_title}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>{t.journey_empty_account}</p>
        </main>
      </AppShell>
    );
  }

  const allDeliverables = data.missions.flatMap((m) => m.deliverables);

  return (
    <AppShell role="player">
      <main style={{ padding: 24, maxWidth: 960 }}>
        <JourneyHeader
          teamName={data.player.name}
          levelLabel={data.levelLabel}
          scoreProject={data.player.scoreProject}
        />
        <JourneyTimeline missions={data.missions} />
        <JourneyDeliverables deliverables={allDeliverables} />
      </main>
    </AppShell>
  );
}
