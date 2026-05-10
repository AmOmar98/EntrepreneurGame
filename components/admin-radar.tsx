"use client";
// Phase 9 / GMR-02 — Admin radar (cohort top-down view).
// Renders one circle per team using computeRadarLayout(). Click on a circle
// opens the GMR-03 focus panel via the onSelect callback.
//
// Phase 11 / B4 — dashed connection lines between simultaneously-active
// teams (state === "active"). Visualises the live-correlation pattern
// from the design source admin-screens.jsx AdminRoom. GM-only surface,
// no R1 surface (no scores rendered on lines).

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

  // Phase 11 / B4 — pair-up active teams for dashed connection lines.
  const activeNodes = nodes.filter((n) => n.state === "active");
  const activePairs: { a: typeof activeNodes[number]; b: typeof activeNodes[number] }[] = [];
  for (let i = 0; i < activeNodes.length; i++) {
    for (let j = i + 1; j < activeNodes.length; j++) {
      activePairs.push({ a: activeNodes[i], b: activeNodes[j] });
    }
  }

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
      {activePairs.length > 0 ? (
        <svg
          aria-hidden="true"
          className="eic-admin-radar__links"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {activePairs.map(({ a, b }) => (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(196, 69, 54, 0.45)"
              strokeWidth={0.4}
              strokeDasharray="1.2 1.2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ) : null}
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
