// DEMO DATA ONLY (DATA-03) — used only when ranking is published in demo mode.
// In Supabase prod mode, lib/profile.ts would query players + submissions +
// evaluations + (future) hacks table. Neutral demo names per BRAND-05.

import type { PlayerProfile } from "@/lib/profile";

export const demoPlayerProfiles: PlayerProfile[] = [
  {
    slug: "demo-equipe-1",
    name: "Équipe Demo",
    currentLevel: "L5 Pitch",
    hackCount: 1,
    winCount: 0,
    mentorCount: 2,
    submissionCount: 6,
    xpTotal: 320,
    skills: [
      { key: "discovery", ratio: 72 },
      { key: "collaboration", ratio: 65 },
      { key: "resilience", ratio: 58 },
      { key: "storytelling", ratio: 47 },
    ],
    badges: [
      { id: "first-submission", label: "Première soumission", unlockedAt: "2026-05-13T10:30:00+01:00" },
      { id: "first-verbatim", label: "Premier verbatim terrain", unlockedAt: "2026-05-13T13:45:00+01:00" },
      { id: "moscow-master", label: "MoSCoW maîtrisé", unlockedAt: "2026-05-13T16:20:00+01:00" },
      { id: "roi-clarity", label: "ROI lisible", unlockedAt: null },
      { id: "pitch-debutant", label: "Pitch en 3 min", unlockedAt: null },
      { id: "endurance", label: "2 jours d'affilée", unlockedAt: "2026-05-14T08:00:00+01:00" },
    ],
    hacks: [
      {
        startedAt: "2026-05-13T08:30:00+01:00",
        endedAt: null,
        eventName: "AgreenTech 2026",
        outcome: "participant",
      },
    ],
    mentors: ["Mentor A", "Mentor B"],
  },
];
