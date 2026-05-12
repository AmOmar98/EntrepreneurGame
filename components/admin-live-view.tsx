"use client";
// Phase 9 / GMR-01 + GMR-02 + GMR-03 + GMR-07 — Admin live view orchestrator.
// design-v3 Mockup 1 (2026-05-12) — refonte layout : KPI strip + leaderboard
// gauche + review queue droite + toast stack overlay + bande fil du jeu en
// bas. Le radar reste accessible mais discrètement en arrière-plan (decorative).

import { useMemo, useState } from "react";
import { AdminGameFlow } from "@/components/admin-game-flow";
import { AdminLeaderboardLive } from "@/components/admin-leaderboard-live";
import { AdminReviewQueue } from "@/components/admin-review-queue";
import { AdminTeamFocus } from "@/components/admin-team-focus";
import { AdminToastStack } from "@/components/admin-toast-stack";
import { PixelMascot } from "@/components/pixel-mascot";
import { Kpi } from "@/components/wf/kpi";
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
    return snapshot.gameFlow.filter(
      (entry) => entry.team === focusedTeam.name,
    );
  }, [focusedTeam, snapshot.gameFlow]);

  // KPI counters dérivés du snapshot.
  const totalTeams = snapshot.teams.length;
  const silentTeams = snapshot.teams.filter(
    (t) => t.state === "stale" || t.state === "idle",
  ).length;
  const totalValidated = snapshot.teams.reduce(
    (acc, t) => acc + t.validatedCount,
    0,
  );
  const totalSubmittedSlots = snapshot.teams.reduce(
    (acc, t) => acc + Math.max(t.submittedCount, t.validatedCount),
    0,
  );
  const pendingCount = snapshot.pendingQueue.length;
  const urgentPending = snapshot.pendingQueue.filter((p) => p.minutesAgo >= 30).length;

  return (
    <div className="eic-admin-live eic-admin-live--v3">
      <header className="eic-admin-live__topbar">
        <div>
          <h2 className="eic-admin-live__title">{t.admin_live_mode_on}</h2>
          <p className="eic-admin-live__subtitle">{t.admin_live_mode_intro}</p>
        </div>
      </header>

      {/* KPI strip top — design-v3 Mockup 1 */}
      <section className="eic-admin-live__kpis">
        <Kpi
          label="Équipes"
          value={totalTeams}
          foot={silentTeams > 0 ? `${silentTeams} silencieuses` : "toutes en jeu"}
          accent="blue"
        />
        <Kpi
          label="Livrables validés"
          value={totalValidated}
          foot={totalSubmittedSlots > 0 ? `sur ${totalSubmittedSlots}` : undefined}
          accent="green"
        />
        <Kpi
          label="En revue"
          value={pendingCount}
          foot={urgentPending > 0 ? `dont ${urgentPending} urgent` : "à jour"}
          accent={urgentPending > 0 ? "amber" : "blue"}
        />
      </section>

      {/* Main grid leaderboard + review queue */}
      <div className="eic-admin-live__grid eic-admin-live__grid--v3">
        <AdminLeaderboardLive
          teams={snapshot.teams}
          onSelectTeam={setFocusedTeamId}
        />
        <AdminReviewQueue pending={snapshot.pendingQueue} />
      </div>

      {/* Horizontal fil du jeu band — design-v3 Mockup 1 */}
      <AdminGameFlow entries={snapshot.gameFlow.slice(0, 30)} />

      {/* Toast stack overlay — design-v3 Mockup 1 */}
      <AdminToastStack
        flow={snapshot.gameFlow}
        pending={snapshot.pendingQueue}
        teams={snapshot.teams}
      />

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
