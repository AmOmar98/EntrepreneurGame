// Phase 9 / GMR-02 — Admin radar layout helper.
// Pure helper that takes the cohort + per-team activity + score and emits
// position / radius / color metadata for the SVG radar (GMR-02).
//
// Layout strategy: deterministic polar arrangement so equally-sized cohorts
// stay visually consistent across reloads. The team with the highest score
// occupies the centre; the rest fan out in a ring sorted by descending score.

import type { TeamActivityState } from "@/lib/team-activity";

export type AdminRadarTeam = {
  id: string;
  name: string;
  scoreProject: number;
  state: TeamActivityState;
  level: number; // current level numeric (0..7)
};

export type AdminRadarNode = AdminRadarTeam & {
  // Percent (0..100) within the radar viewport — drives style.left/top.
  x: number;
  y: number;
  // Pixel radius for the circle (28..80).
  radius: number;
  // Resolved fill / ring colour (hex) — drives the SVG paint.
  fill: string;
  ring: string;
  isCenter: boolean;
};

const RADIUS_MIN = 28;
const RADIUS_MAX = 72;

const COLOR_ACTIVE_FILL = "#3D6B95"; // saturated blue (live energy)
const COLOR_ACTIVE_RING = "#C44536"; // red ring + pulse
const COLOR_IDLE_FILL = "#4A7BB0"; // softer blue (between waves)
const COLOR_IDLE_RING = "#1B3A5C";
const COLOR_STALE_FILL = "#9A917F"; // grey-stone
const COLOR_STALE_RING = "#9A917F";

/**
 * Map a team activity state to its fill + ring colours.
 */
export function colorForState(state: TeamActivityState): {
  fill: string;
  ring: string;
} {
  switch (state) {
    case "active":
      return { fill: COLOR_ACTIVE_FILL, ring: COLOR_ACTIVE_RING };
    case "idle":
      return { fill: COLOR_IDLE_FILL, ring: COLOR_IDLE_RING };
    case "stale":
      return { fill: COLOR_STALE_FILL, ring: COLOR_STALE_RING };
  }
}

/**
 * Build the radar layout. Returns one node per team with positions,
 * radii and colours ready for the SVG renderer.
 */
export function computeRadarLayout(
  teams: AdminRadarTeam[],
): AdminRadarNode[] {
  if (teams.length === 0) return [];

  const sorted = [...teams].sort((a, b) => b.scoreProject - a.scoreProject);
  const maxScore = Math.max(1, sorted[0].scoreProject);
  const minScore = sorted[sorted.length - 1].scoreProject;
  const span = Math.max(1, maxScore - minScore);

  const nodes: AdminRadarNode[] = [];

  // Centre slot — highest scorer.
  const centreTeam = sorted[0];
  nodes.push({
    ...centreTeam,
    x: 50,
    y: 50,
    radius: scoreToRadius(centreTeam.scoreProject, minScore, span),
    ...colorForState(centreTeam.state),
    isCenter: true,
  });

  // Other teams arranged on a polar ring around the centre.
  const ringTeams = sorted.slice(1);
  const ringCount = ringTeams.length;
  if (ringCount > 0) {
    // Single ring radius (% of viewport) — keeps the layout simple at
    // pilot-grade volume (≤15 teams).
    const ringRadiusPct = ringCount > 8 ? 36 : 30;
    for (let i = 0; i < ringCount; i++) {
      const angle = (2 * Math.PI * i) / ringCount - Math.PI / 2; // start at top
      const cx = 50 + ringRadiusPct * Math.cos(angle);
      const cy = 50 + ringRadiusPct * Math.sin(angle) * 0.78; // slight ellipse for portrait viewports
      const t = ringTeams[i];
      nodes.push({
        ...t,
        x: clamp(cx, 8, 92),
        y: clamp(cy, 12, 88),
        radius: scoreToRadius(t.scoreProject, minScore, span),
        ...colorForState(t.state),
        isCenter: false,
      });
    }
  }

  return nodes;
}

function scoreToRadius(score: number, minScore: number, span: number): number {
  const t = (score - minScore) / span;
  return Math.round(RADIUS_MIN + t * (RADIUS_MAX - RADIUS_MIN));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
