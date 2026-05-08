// DEMO DATA ONLY (DATA-03) — used only when hasSupabaseEnv() is false.
// In Supabase prod mode, lib/seed/index.ts returns [] (cf DATA-03).
// Never reference real partners (Tamwilcom, Bank of Africa, Innov Invest, Bluespace)
// nor pre-prod seed names (atlas-soil...). Real Hack-Days deliverable templates
// are seeded via database/seed_event_hackdays.sql (Phase 2 / Plan 04).
import type { DeliverableTemplate } from "@/lib/types";

// Demo deliverable templates — neutral names; the real Hack-Days seed lives in SQL.
export const demoDeliverableTemplates: DeliverableTemplate[] = [
  {
    id: "00000000-0000-0000-0000-0000000000d1",
    missionId: "00000000-0000-0000-0000-0000000000b1",
    slug: "demo-problem-statement",
    title: "Demo - Enonce du probleme",
    description: "Demo deliverable for the problem mission.",
    rubric: [
      { key: "clarity", label: "Clarte", max: 25 },
      { key: "specificity", label: "Specificite", max: 25 },
      { key: "evidence", label: "Preuves", max: 25 },
      { key: "scope", label: "Perimetre", max: 25 },
    ],
    maxScore: 100,
    ord: 1,
  },
  {
    id: "00000000-0000-0000-0000-0000000000d2",
    missionId: "00000000-0000-0000-0000-0000000000b2",
    slug: "demo-solution-sketch",
    title: "Demo - Esquisse de solution",
    description: "Demo deliverable for the solution mission.",
    rubric: [
      { key: "fit", label: "Adequation", max: 50 },
      { key: "feasibility", label: "Faisabilite", max: 50 },
    ],
    maxScore: 100,
    ord: 1,
  },
];
