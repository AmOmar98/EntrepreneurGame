"use client";
// Phase 9 / GMR-01 + GMR-02 + GMR-03 + GMR-07 — Admin live view orchestrator.
// Owns the team-focus modal state and renders Pixel mascot + radar + game flow.

import { useMemo, useState } from "react";
import { AdminGameFlow } from "@/components/admin-game-flow";
import { AdminRadar } from "@/components/admin-radar";
import { AdminTeamFocus } from "@/components/admin-team-focus";
import { PixelMascot } from "@/components/pixel-mascot";
import type { AdminLiveSnapshot } from "@/lib/admin-live";
import type { HackStatusResult } from "@/lib/hack-status";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  snapshot: AdminLiveSnapshot;
  hackStatus: HackStatusResult;
};

export function AdminLiveView({ snapshot, hackStatus }: Props) {
  const [focusedTeamId, setFocusedTeamId] = useState<string | null>(null);

  // Compute a stable rank lookup (descending scoreProject — same ordering as snapshot.teams).
  const ranks = useMemo(() => {
    const sorted = [...snapshot.teams].sort(
      (a, b) => b.scoreProject - a.scoreProject,
    );
    const map = new Map<string, number>();
    sorted.forEach((team, idx) => map.set(team.id, idx + 1));
    return map;
  }, [snapshot.teams]);

  const focusedTeam = focusedTeamId
    ? snapshot.teams.find((team) => team.id === focusedTeamId) ?? null
    : null;

  const focusedActivity = useMemo(() => {
    if (!focusedTeam) return [];
    // Filter game flow entries that mention this team's name (server side
    // didn't denormalise team_id on entries, so we match by name — safe at
    // pilot volume because team names are unique within an event).
    return snapshot.gameFlow.filter(
      (entry) => entry.team === focusedTeam.name,
    );
  }, [focusedTeam, snapshot.gameFlow]);

  return (
    <div className="eic-admin-live">
      <header className="eic-admin-live__topbar">
        <div>
          <h2 className="eic-admin-live__title">{t.admin_live_mode_on}</h2>
          <p className="eic-admin-live__subtitle">{t.admin_live_mode_intro}</p>
        </div>
      </header>

      <div className="eic-admin-live__grid">
        <AdminRadar teams={snapshot.teams} onSelect={setFocusedTeamId} />
        <AdminGameFlow entries={snapshot.gameFlow.slice(0, 30)} />
      </div>

      {focusedTeam ? (
        <AdminTeamFocus
          team={focusedTeam}
          rank={ranks.get(focusedTeam.id) ?? 0}
          activity={focusedActivity}
          onClose={() => setFocusedTeamId(null)}
        />
      ) : null}

      <PixelMascot result={hackStatus} />
    </div>
  );
}
