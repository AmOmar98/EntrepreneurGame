"use client";
// Phase 9 / GMR-02 — Single team circle on the admin radar.
// Pure presentational — animations are CSS-driven (vibrate + pulse rings),
// so React does not re-render on every animation tick.

import type { AdminRadarNode } from "@/lib/admin-radar";

type Props = {
  node: AdminRadarNode;
  onSelect: (teamId: string) => void;
};

export function AdminTeamCircle({ node, onSelect }: Props) {
  const stateClass =
    node.state === "active"
      ? "eic-admin-team-circle--active"
      : node.state === "stale"
        ? "eic-admin-team-circle--stale"
        : "eic-admin-team-circle--idle";

  const size = node.radius * 2;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`eic-admin-team-circle ${stateClass}`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        background: `radial-gradient(circle at 35% 30%, ${node.fill}cc, ${node.fill})`,
        borderColor:
          node.state === "active"
            ? "#fff"
            : node.state === "stale"
              ? "rgba(255, 255, 255, 0.45)"
              : "rgba(255, 255, 255, 0.65)",
      }}
      aria-label={`${node.name} · L${node.level} · ${Math.round(node.scoreProject)} XP`}
    >
      <span className="eic-admin-team-circle__name">{node.name}</span>
      <span className="eic-admin-team-circle__meta">
        L{node.level} · {Math.round(node.scoreProject)}
      </span>
      {node.state === "active" ? (
        <span className="eic-admin-team-circle__live-pill">● LIVE</span>
      ) : null}
    </button>
  );
}
