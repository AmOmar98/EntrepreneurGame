"use client";
// Phase 9 / GMR-02 — Admin radar (cohort top-down view).
// Renders one circle per team using computeRadarLayout(). Click on a circle
// opens the GMR-03 focus panel via the onSelect callback.

import { AdminTeamCircle } from "@/components/admin-team-circle";
import type { AdminLiveTeam } from "@/lib/admin-live";
import { computeRadarLayout } from "@/lib/admin-radar";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  teams: AdminLiveTeam[];
  onSelect: (teamId: string) => void;
};

export function AdminRadar({ teams, onSelect }: Props) {
  const nodes = computeRadarLayout(
    teams.map((team) => ({
      id: team.id,
      name: team.name,
      scoreProject: team.scoreProject,
      state: team.state,
      level: team.level,
    })),
  );

  return (
    <div
      className="eic-admin-radar"
      role="region"
      aria-label={t.admin_radar_aria}
    >
      <div className="eic-admin-radar__grid" aria-hidden="true" />
      <div className="eic-admin-radar__sweep" aria-hidden="true" />
      <div
        className="eic-admin-radar__sweep eic-admin-radar__sweep--inner"
        aria-hidden="true"
      />
      {nodes.length === 0 ? (
        <div className="eic-admin-radar__empty">{t.admin_radar_empty}</div>
      ) : (
        nodes.map((node) => (
          <AdminTeamCircle key={node.id} node={node} onSelect={onSelect} />
        ))
      )}
      <div className="eic-admin-radar__legend" aria-hidden="true">
        <div className="eic-admin-radar__legend-row">
          <span
            className="eic-admin-radar__legend-dot"
            style={{ background: "#3D6B95", boxShadow: "0 0 0 3px rgba(196,69,54,0.4)" }}
          />
          <span>{t.admin_radar_legend_active}</span>
        </div>
        <div className="eic-admin-radar__legend-row">
          <span
            className="eic-admin-radar__legend-dot"
            style={{ background: "#4A7BB0" }}
          />
          <span>{t.admin_radar_legend_idle}</span>
        </div>
        <div className="eic-admin-radar__legend-row">
          <span
            className="eic-admin-radar__legend-dot"
            style={{ background: "#9A917F", opacity: 0.6 }}
          />
          <span>{t.admin_radar_legend_stale}</span>
        </div>
      </div>
    </div>
  );
}
