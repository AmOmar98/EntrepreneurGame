// DEMO DATA ONLY (DATA-03) — used only when hasSupabaseEnv() is false.
// In Supabase prod mode, lib/seed/index.ts returns [] (cf DATA-03).
// Never reference real partners (Tamwilcom, Bank of Africa, Innov Invest, Bluespace)
// nor pre-prod seed names (atlas-soil...). Real Hack-Days data is seeded via
// database/seed_event_hackdays.sql (Phase 2 / Plan 04).
import type { Mission } from "@/lib/types";

// Demo missions only — neutral names; the real Hack-Days seed lives in SQL.
export const demoMissions: Mission[] = [
  {
    id: "00000000-0000-0000-0000-0000000000b1",
    eventId: "00000000-0000-0000-0000-0000000000e0",
    levelId: "L1_problem",
    ord: 1,
    kind: "atelier",
    title: "Demo - Atelier Probleme",
    scheduledAt: null,
  },
  {
    id: "00000000-0000-0000-0000-0000000000b2",
    eventId: "00000000-0000-0000-0000-0000000000e0",
    levelId: "L2_solution",
    ord: 2,
    kind: "atelier",
    title: "Demo - Atelier Solution",
    scheduledAt: null,
  },
];
