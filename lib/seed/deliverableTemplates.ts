import type { DeliverableTemplate } from "@/lib/types";

// Demo deliverable templates — replaced in Phase 2 with the real Hack-Days seed.
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
