import type { Player } from "@/lib/types";

// Demo data only. Used when hasSupabaseEnv() is false.
// Neutral demo names (BRAND-05) — never references partners or atlas-soil.
export const demoPlayers: Player[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    cohortId: "00000000-0000-0000-0000-0000000000aa",
    slug: "demo-alpha",
    name: "Demo Team Alpha",
    idea: "Demo idee A",
    currentLevel: "L1_problem",
    status: "active",
    scoreProject: 0,
    scoreEngagement: 0,
    onboardedAt: null,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    cohortId: "00000000-0000-0000-0000-0000000000aa",
    slug: "demo-beta",
    name: "Demo Team Beta",
    idea: "Demo idee B",
    currentLevel: "L0_diagnostic",
    status: "active",
    scoreProject: 0,
    scoreEngagement: 0,
    onboardedAt: null,
  },
];
