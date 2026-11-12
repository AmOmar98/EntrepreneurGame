"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";
import { captureEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import { dictionaries } from "@/lib/i18n";
import { AutoSaveBadge } from "@/components/auto-save-badge";
import { PixelMascotPlayer } from "@/components/pixel-mascot-player";
import { SubmissionForm } from "@/components/submission-form";
import { buildDraftStorageKey } from "@/hooks/use-auto-save";
import { useFirstDeliveryTrigger } from "@/hooks/use-pixel-trigger";

const t = dictionaries.fr;

export type InteractiveDeliverableComposerProps = {
  deliverableTemplateId: string;
  deliverableSlug: string;
  deliverableTitle: string;
  playerId?: string | null;
  version?: 1 | 2;
  initialProofText?: string | null;
  initialProofUrl?: string | null;
};

export type ImpactEffortQuadrantId =
  | "quick_wins"
  | "grands_projets"
  | "fill_ins"
  | "a_ecarter";

export type ImpactEffortCard = {
  id: string;
  titre: string;
  quadrant: ImpactEffortQuadrantId;
  delaiEstime: string;
};

export type LeanExperimentCard = {
  id: string;
  hypothese: string;
  protocoleTest: string;
  indicateurSucces: string;
  seuilValidation: string;
};

export type RoadmapMilestoneId = "jalon_1" | "jalon_2" | "jalon_3";

export type RoadmapMilestone = {
  id: RoadmapMilestoneId;
  label: string;
  horizon: string;
  objectif: string;
  livrableCle: string;
  kpi: string;
};

export type RiskCategory =
  | "technique"
  | "marche"
  | "reglementaire"
  | "operationnel";

export type RiskLevel = "eleve" | "moyen" | "faible";

export type RiskItem = {
  id: string;
  risque: string;
  categorie: RiskCategory;
  niveau: RiskLevel;
  mitigation: string;
};

type StudioState = {
  cards: ImpactEffortCard[];
  experiments: LeanExperimentCard[];
  milestones: Record<
    RoadmapMilestoneId,
    { objectif: string; livrableCle: string; kpi: string }
  >;
  risks: RiskItem[];
};

const QUADRANTS: {
  id: ImpactEffortQuadrantId;
  title: string;
  shortLabel: string;
  subtitle: string;
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    id: "quick_wins",
    title: "⚡ Quick Wins — Fort Impact / Faible Effort",
    shortLabel: "⚡ Quick Win",
    subtitle: "Priorité immédiate : valeur client maximale dès le MVP.",
    bg: "#f0fdf4",
    border: "#86efac",
    badgeBg: "#dcfce7",
    badgeText: "#166534",
  },
  {
    id: "grands_projets",
    title: "🏗️ Grands Chantiers — Fort Impact / Fort Effort",
    shortLabel: "🏗️ Grand Chantier",
    subtitle: "Structurant à moyen terme : à découper en sous-étapes.",
    bg: "#eff6ff",
    border: "#93c5fd",
    badgeBg: "#dbeafe",
    badgeText: "#1e40af",
  },
  {
    id: "fill_ins",
    title: "🧩 Compléments — Faible Impact / Faible Effort",
    shortLabel: "🧩 Complément",
    subtitle: "Confort d'usage : à intégrer si le temps le permet.",
    bg: "#fefce8",
    border: "#fde047",
    badgeBg: "#fef9c3",
    badgeText: "#854d0e",
  },
  {
    id: "a_ecarter",
    title: "🚫 À écarter — Faible Impact / Fort Effort",
    shortLabel: "🚫 À écarter",
    subtitle: "Hors périmètre MVP : éviter la dispersion technique.",
    bg: "#fef2f2",
    border: "#fca5a5",
    badgeBg: "#fee2e2",
    badgeText: "#991b1b",
  },
];

const MILESTONE_DEFINITIONS: {
  id: RoadmapMilestoneId;
  title: string;
  horizon: string;
  accent: string;
  placeholderObj: string;
  placeholderLivrable: string;
  placeholderKpi: string;
}[] = [
  {
    id: "jalon_1",
    title: "Jalon 1 — Prototype / Pilote (M1–M3)",
    horizon: "Court terme (M1–M3)",
    accent: "#0f766e",
    placeholderObj: "Ex : Valider l'usage réel auprès des 15 premiers utilisateurs pilotes",
    placeholderLivrable: "Ex : Prototype fonctionnel + parcours cœur sans friction",
    placeholderKpi: "Ex : 15 testeurs actifs, taux de complétion > 70%",
  },
  {
    id: "jalon_2",
    title: "Jalon 2 — Lancement V1 (M4–M6)",
    horizon: "Moyen terme (M4–M6)",
    accent: "#1d4ed8",
    placeholderObj: "Ex : Industrialiser la V1 et convertir les premiers clients payants",
    placeholderLivrable: "Ex : Application V1 déployée, paiement / facturation et support",
    placeholderKpi: "Ex : 50 clients actifs, rétention à 30 jours > 60%",
  },
  {
    id: "jalon_3",
    title: "Jalon 3 — Déploiement (M7–M12)",
    horizon: "Long terme (M7–M12)",
    accent: "#6d28d9",
    placeholderObj: "Ex : Passer à l'échelle régionale et automatiser les opérations",
    placeholderLivrable: "Ex : Plateforme multi-partenaires + API / intégrations clés",
    placeholderKpi: "Ex : 300 utilisateurs réguliers, coût d'acquisition stabilisé",
  },
];

const RISK_CATEGORIES: {
  id: RiskCategory;
  label: string;
  badgeBg: string;
  badgeColor: string;
}[] = [
  {
    id: "technique",
    label: "⚙️ Technique",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
  },
  {
    id: "marche",
    label: "📈 Marché",
    badgeBg: "#f3e8ff",
    badgeColor: "#6b21a8",
  },
  {
    id: "reglementaire",
    label: "⚖️ Réglementaire",
    badgeBg: "#fef3c7",
    badgeColor: "#92400e",
  },
  {
    id: "operationnel",
    label: "🤝 Opérationnel",
    badgeBg: "#dcfce7",
    badgeColor: "#166534",
  },
];

const RISK_LEVELS: {
  id: RiskLevel;
  label: string;
  bg: string;
  color: string;
  border: string;
}[] = [
  {
    id: "eleve",
    label: "🔴 Élevé",
    bg: "#fef2f2",
    color: "#991b1b",
    border: "#fca5a5",
  },
  {
    id: "moyen",
    label: "🟠 Moyen",
    bg: "#fffbeb",
    color: "#92400e",
    border: "#fcd34d",
  },
  {
    id: "faible",
    label: "🟢 Faible",
    bg: "#f0fdf4",
    color: "#166534",
    border: "#86efac",
  },
];

const PROTOCOL_PRESETS = [
  "Maquette interactive Figma",
  "Landing page + pré-inscription",
  "Concierge MVP (manuel)",
  "Prototype no-code / low-code",
  "Test pilote terrain (5-10 utilisateurs)",
];

function createDefaultState(): StudioState {
  return {
    cards: [
      {
        id: "card-1",
        titre: "",
        quadrant: "quick_wins",
        delaiEstime: "1-2 sem.",
      },
      {
        id: "card-2",
        titre: "",
        quadrant: "grands_projets",
        delaiEstime: "1-2 mois",
      },
      {
        id: "card-3",
        titre: "",
        quadrant: "fill_ins",
        delaiEstime: "3-5 jours",
      },
      {
        id: "card-4",
        titre: "",
        quadrant: "a_ecarter",
        delaiEstime: "Hors MVP",
      },
    ],
    experiments: [
      {
        id: "exp-1",
        hypothese: "",
        protocoleTest: "",
        indicateurSucces: "",
        seuilValidation: "",
      },
    ],
    milestones: {
      jalon_1: { objectif: "", livrableCle: "", kpi: "" },
      jalon_2: { objectif: "", livrableCle: "", kpi: "" },
      jalon_3: { objectif: "", livrableCle: "", kpi: "" },
    },
    risks: [
      {
        id: "risk-1",
        risque: "",
        categorie: "technique",
        niveau: "eleve",
        mitigation: "",
      },
      {
        id: "risk-2",
        risque: "",
        categorie: "marche",
        niveau: "moyen",
        mitigation: "",
      },
    ],
  };
}

function serializeStudioToMarkdown(
  deliverableTitle: string,
  state: StudioState,
): string {
  const lines: string[] = [];
  lines.push(`# ${deliverableTitle}`);
  lines.push("");

  // Section 1: Impact vs Effort Matrix
  lines.push("## 1. Matrice Impact vs Effort (Priorisation Technique)");
  lines.push("");
  for (const q of QUADRANTS) {
    lines.push(`### ${q.title}`);
    const qCards = state.cards.filter(
      (c) => c.quadrant === q.id && c.titre.trim().length > 0,
    );
    if (qCards.length === 0) {
      lines.push("- _(Aucun élément renseigné)_");
    } else {
      for (const c of qCards) {
        const delai = c.delaiEstime.trim()
          ? ` — _Délai estimé : ${c.delaiEstime.trim()}_`
          : "";
        lines.push(`- **${c.titre.trim()}**${delai}`);
      }
    }
    lines.push("");
  }

  // Section 2: Lean Experimentation
  lines.push("## 2. Lean Expérimentation & Tests Rapides");
  lines.push("");
  const filledExps = state.experiments.filter(
    (e) =>
      e.hypothese.trim().length > 0 ||
      e.protocoleTest.trim().length > 0 ||
      e.indicateurSucces.trim().length > 0 ||
      e.seuilValidation.trim().length > 0,
  );
  if (filledExps.length === 0) {
    lines.push("- _(Aucune expérimentation renseignée)_");
    lines.push("");
  } else {
    filledExps.forEach((exp, idx) => {
      lines.push(`### Test #${idx + 1} : ${exp.hypothese.trim() || "Hypothèse à préciser"}`);
      lines.push(`- **Protocole de test** : ${exp.protocoleTest.trim() || "Non renseigné"}`);
      lines.push(`- **Indicateur de succès (KPI)** : ${exp.indicateurSucces.trim() || "Non renseigné"}`);
      lines.push(`- **Seuil de validation** : ${exp.seuilValidation.trim() || "Non renseigné"}`);
      lines.push("");
    });
  }

  // Section 3: Roadmap 3 Jalons
  lines.push("## 3. Feuille de Route Produit (3 Jalons)");
  lines.push("");
  for (const mDef of MILESTONE_DEFINITIONS) {
    const m = state.milestones[mDef.id];
    lines.push(`### ${mDef.title}`);
    lines.push(`- **Objectif** : ${m.objectif.trim() || "Non renseigné"}`);
    lines.push(`- **Livrable clé** : ${m.livrableCle.trim() || "Non renseigné"}`);
    lines.push(`- **KPI de validation** : ${m.kpi.trim() || "Non renseigné"}`);
    lines.push("");
  }

  // Section 4: Risk Register
  lines.push("## 4. Registre des Risques & Plan de Mitigation");
  lines.push("");
  const filledRisks = state.risks.filter(
    (r) => r.risque.trim().length > 0 || r.mitigation.trim().length > 0,
  );
  if (filledRisks.length === 0) {
    lines.push("- _(Aucun risque renseigné)_");
    lines.push("");
  } else {
    for (const r of filledRisks) {
      const catLabel =
        RISK_CATEGORIES.find((c) => c.id === r.categorie)?.label ?? r.categorie;
      const lvlLabel =
        RISK_LEVELS.find((l) => l.id === r.niveau)?.label ?? r.niveau;
      lines.push(
        `- **[${catLabel} | Criticité : ${lvlLabel}] ${r.risque.trim() || "Risque à préciser"}**`,
      );
      lines.push(
        `  - _Plan de mitigation_ : ${r.mitigation.trim() || "À définir"}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

const initialWorkflowState: WorkflowState = { ok: false, message: "" };

export function FeasibilityRoadmapComposer({
  deliverableTemplateId,
  deliverableSlug,
  deliverableTitle,
  playerId,
  version = 1,
  initialProofText,
  initialProofUrl,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "external">(
    initialProofUrl && !initialProofText ? "external" : "studio",
  );
  const [studio, setStudio] = useState<StudioState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDelay, setNewCardDelay] = useState("1-2 sem.");
  const [newCardQuadrant, setNewCardQuadrant] =
    useState<ImpactEffortQuadrantId>("quick_wins");

  const [state, formAction, pending] = useActionState(
    submitDeliverable,
    initialWorkflowState,
  );
  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  const storageKey = useMemo(
    () =>
      `${buildDraftStorageKey({
        playerId,
        deliverableTemplateId,
        version,
      })}_studio`,
    [playerId, deliverableTemplateId, version],
  );

  // Hydrate studio state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StudioState>;
        setStudio((prev) => ({
          cards:
            Array.isArray(parsed.cards) && parsed.cards.length > 0
              ? parsed.cards
              : prev.cards,
          experiments:
            Array.isArray(parsed.experiments) && parsed.experiments.length > 0
              ? parsed.experiments
              : prev.experiments,
          milestones: parsed.milestones
            ? {
                jalon_1: {
                  objectif: parsed.milestones.jalon_1?.objectif ?? "",
                  livrableCle: parsed.milestones.jalon_1?.livrableCle ?? "",
                  kpi: parsed.milestones.jalon_1?.kpi ?? "",
                },
                jalon_2: {
                  objectif: parsed.milestones.jalon_2?.objectif ?? "",
                  livrableCle: parsed.milestones.jalon_2?.livrableCle ?? "",
                  kpi: parsed.milestones.jalon_2?.kpi ?? "",
                },
                jalon_3: {
                  objectif: parsed.milestones.jalon_3?.objectif ?? "",
                  livrableCle: parsed.milestones.jalon_3?.livrableCle ?? "",
                  kpi: parsed.milestones.jalon_3?.kpi ?? "",
                },
              }
            : prev.milestones,
          risks:
            Array.isArray(parsed.risks) && parsed.risks.length > 0
              ? parsed.risks
              : prev.risks,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore corrupted JSON or unavailable storage
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Save studio state to localStorage on every change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Ignore quota / privacy errors
    }
  }, [studio, hydrated, storageKey]);

  // Handle submission success
  useEffect(() => {
    if (state.ok) {
      captureEvent(ANALYTICS_EVENTS.eg_deliverable_submitted, {
        deliverableTemplateId,
        deliverableSlug,
        version,
      });
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // noop
        }
      }
      router.refresh();
    }
  }, [
    state.ok,
    deliverableTemplateId,
    deliverableSlug,
    version,
    storageKey,
    router,
  ]);

  // Section completion checks (R2 warn-only pedagogical indicator)
  const sectionStatus = useMemo(() => {
    const s1 = studio.cards.some((c) => c.titre.trim().length > 0);
    const s2 = studio.experiments.some(
      (e) =>
        e.hypothese.trim().length > 0 && e.protocoleTest.trim().length > 0,
    );
    const s3 = Object.values(studio.milestones).some(
      (m) => m.objectif.trim().length > 0 || m.livrableCle.trim().length > 0,
    );
    const s4 = studio.risks.some(
      (r) => r.risque.trim().length > 0 && r.mitigation.trim().length > 0,
    );
    const completedCount = [s1, s2, s3, s4].filter(Boolean).length;
    return { s1, s2, s3, s4, completedCount };
  }, [studio]);

  const serializedMarkdown = useMemo(
    () => serializeStudioToMarkdown(deliverableTitle, studio),
    [deliverableTitle, studio],
  );

  // Card handlers
  function addImpactCard(quadrant: ImpactEffortQuadrantId, titre = "", delai = "1-2 sem.") {
    const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setStudio((prev) => ({
      ...prev,
      cards: [
        ...prev.cards,
        {
          id,
          titre,
          quadrant,
          delaiEstime: delai,
        },
      ],
    }));
  }

  function handleQuickAddCard() {
    if (!newCardTitle.trim()) return;
    addImpactCard(newCardQuadrant, newCardTitle.trim(), newCardDelay.trim());
    setNewCardTitle("");
  }

  function updateImpactCard(
    id: string,
    patch: Partial<Omit<ImpactEffortCard, "id">>,
  ) {
    setStudio((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function removeImpactCard(id: string) {
    setStudio((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
    }));
  }

  // Experiment handlers
  function addExperiment() {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setStudio((prev) => ({
      ...prev,
      experiments: [
        ...prev.experiments,
        {
          id,
          hypothese: "",
          protocoleTest: "",
          indicateurSucces: "",
          seuilValidation: "",
        },
      ],
    }));
  }

  function updateExperiment(
    id: string,
    patch: Partial<Omit<LeanExperimentCard, "id">>,
  ) {
    setStudio((prev) => ({
      ...prev,
      experiments: prev.experiments.map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    }));
  }

  function removeExperiment(id: string) {
    setStudio((prev) => ({
      ...prev,
      experiments: prev.experiments.filter((e) => e.id !== id),
    }));
  }

  // Milestone handler
  function updateMilestone(
    id: RoadmapMilestoneId,
    field: "objectif" | "livrableCle" | "kpi",
    value: string,
  ) {
    setStudio((prev) => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [id]: {
          ...prev.milestones[id],
          [field]: value,
        },
      },
    }));
  }

  // Risk handlers
  function addRisk() {
    const id = `risk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setStudio((prev) => ({
      ...prev,
      risks: [
        ...prev.risks,
        {
          id,
          risque: "",
          categorie: "technique",
          niveau: "moyen",
          mitigation: "",
        },
      ],
    }));
  }

  function updateRisk(id: string, patch: Partial<Omit<RiskItem, "id">>) {
    setStudio((prev) => ({
      ...prev,
      risks: prev.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function removeRisk(id: string) {
    setStudio((prev) => ({
      ...prev,
      risks: prev.risks.filter((r) => r.id !== id),
    }));
  }

  const submitLabel =
    version === 2 ? t.submission_v2_submit : t.submission_submit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
      {/* Mode Switcher Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#0f766e",
            }}
          >
            Studio Faisabilité & Roadmap · J1 14h00–14h45
          </span>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#475569" }}>
            Arbitrez vos priorités techniques (Impact/Effort), définissez vos tests rapides, vos 3 jalons et vos risques.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Mode de saisie du livrable"
          style={{
            display: "inline-flex",
            background: "#e2e8f0",
            padding: 4,
            borderRadius: 8,
            gap: 4,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "studio"}
            onClick={() => setMode("studio")}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "studio" ? "#0B2545" : "transparent",
              color: mode === "studio" ? "#ffffff" : "#334155",
            }}
          >
            Atelier interactif (recommandé)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "external"}
            onClick={() => setMode("external")}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "external" ? "#0B2545" : "transparent",
              color: mode === "external" ? "#ffffff" : "#334155",
            }}
          >
            Lien externe / Texte libre
          </button>
        </div>
      </div>

      {mode === "external" ? (
        <SubmissionForm
          deliverableTemplateId={deliverableTemplateId}
          playerId={playerId}
          version={version}
        />
      ) : (
        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <input
            type="hidden"
            name="deliverableTemplateId"
            value={deliverableTemplateId}
          />
          <input type="hidden" name="kind" value="proof_text" />
          <input type="hidden" name="proofText" value={serializedMarkdown} />

          {/* R2 Warn-only Pedagogical Progress Strip */}
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background:
                sectionStatus.completedCount === 4 ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${
                sectionStatus.completedCount === 4 ? "#86efac" : "#fde68a"
              }`,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    sectionStatus.completedCount === 4 ? "#166534" : "#92400e",
                }}
              >
                {sectionStatus.completedCount === 4
                  ? "✓ Les 4 volets de faisabilité sont complétés — prêt à soumettre !"
                  : `Progression de l'atelier : ${sectionStatus.completedCount} / 4 volets renseignés (indicatif)`}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
                <span style={{ color: sectionStatus.s1 ? "#15803d" : "#b45309" }}>
                  {sectionStatus.s1 ? "✓" : "○"} 1. Matrice Impact/Effort
                </span>
                <span style={{ color: sectionStatus.s2 ? "#15803d" : "#b45309" }}>
                  {sectionStatus.s2 ? "✓" : "○"} 2. Lean Tests
                </span>
                <span style={{ color: sectionStatus.s3 ? "#15803d" : "#b45309" }}>
                  {sectionStatus.s3 ? "✓" : "○"} 3. Feuille de route (3 jalons)
                </span>
                <span style={{ color: sectionStatus.s4 ? "#15803d" : "#b45309" }}>
                  {sectionStatus.s4 ? "✓" : "○"} 4. Risques & Mitigation
                </span>
              </div>
            </div>
            <AutoSaveBadge lastSavedAt={lastSavedAt} />
          </div>

          {/* SECTION 1: Matrice Impact vs Effort (2x2 Interactive Quadrant Board) */}
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#1d4ed8",
                }}
              >
                Étape 1 / 4 · Arbitrage Produit & Technique
              </span>
              <h3 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700 }}>
                1. Matrice Impact vs Effort (Cartes à placer)
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                Ajoutez vos fonctionnalités ou briques techniques et déplacez chaque carte en 1 clic entre les 4 quadrants pour isoler vos Quick Wins.
              </p>
            </div>

            {/* Quick Add Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
                alignItems: "flex-end",
              }}
            >
              <label style={{ flex: "2 1 220px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                  Nouvelle fonctionnalité / brique technique
                </span>
                <input
                  type="text"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickAddCard();
                    }
                  }}
                  placeholder="Ex : Algorithme de recommandation, Alertes SMS, Dashboard partenaire..."
                  className="eic-form-input"
                  style={{ fontSize: 13 }}
                />
              </label>

              <label style={{ flex: "1 1 130px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                  Délai estimé
                </span>
                <input
                  type="text"
                  value={newCardDelay}
                  onChange={(e) => setNewCardDelay(e.target.value)}
                  placeholder="Ex : 2 sem."
                  className="eic-form-input"
                  style={{ fontSize: 13 }}
                />
              </label>

              <label style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                  Quadrant cible
                </span>
                <select
                  value={newCardQuadrant}
                  onChange={(e) =>
                    setNewCardQuadrant(e.target.value as ImpactEffortQuadrantId)
                  }
                  className="eic-form-input"
                  style={{ fontSize: 13 }}
                >
                  {QUADRANTS.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.shortLabel}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleQuickAddCard}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0B2545",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: 40,
                }}
              >
                + Placer la carte
              </button>
            </div>

            {/* 2x2 Quadrant Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {QUADRANTS.map((q) => {
                const qCards = studio.cards.filter((c) => c.quadrant === q.id);
                return (
                  <div
                    key={q.id}
                    style={{
                      background: q.bg,
                      border: `1.5px solid ${q.border}`,
                      borderRadius: 10,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      minHeight: 210,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {q.title}
                        </h4>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: 11,
                            color: "#475569",
                          }}
                        >
                          {q.subtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addImpactCard(q.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          fontWeight: 600,
                          background: "#ffffff",
                          color: "#0f172a",
                          border: "1px solid #cbd5e1",
                          borderRadius: 6,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Carte
                      </button>
                    </div>

                    {qCards.length === 0 ? (
                      <p
                        style={{
                          margin: "12px 0",
                          fontSize: 12,
                          color: "#64748b",
                          fontStyle: "italic",
                        }}
                      >
                        Aucune carte dans ce quadrant. Cliquez sur « + Carte » ou déplacez une carte existante.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {qCards.map((card) => (
                          <div
                            key={card.id}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: 10,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                            }}
                          >
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <input
                                type="text"
                                value={card.titre}
                                onChange={(e) =>
                                  updateImpactCard(card.id, {
                                    titre: e.target.value,
                                  })
                                }
                                placeholder="Fonctionnalité ou module technique..."
                                aria-label={`Titre de la carte (${q.shortLabel})`}
                                className="eic-form-input"
                                style={{ flex: 1, fontSize: 13, padding: "6px 8px" }}
                              />
                              <input
                                type="text"
                                value={card.delaiEstime}
                                onChange={(e) =>
                                  updateImpactCard(card.id, {
                                    delaiEstime: e.target.value,
                                  })
                                }
                                placeholder="Délai"
                                aria-label={`Délai estimé (${q.shortLabel})`}
                                className="eic-form-input"
                                style={{ width: 88, fontSize: 12, padding: "6px 8px" }}
                              />
                              <button
                                type="button"
                                onClick={() => removeImpactCard(card.id)}
                                aria-label="Supprimer cette carte"
                                style={{
                                  border: "none",
                                  background: "#fee2e2",
                                  color: "#991b1b",
                                  borderRadius: 6,
                                  width: 28,
                                  height: 28,
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                ✕
                              </button>
                            </div>

                            {/* One-click quadrant mover */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#64748b",
                                  marginRight: 2,
                                }}
                              >
                                Déplacer vers :
                              </span>
                              {QUADRANTS.map((targetQ) => {
                                const active = card.quadrant === targetQ.id;
                                return (
                                  <button
                                    key={targetQ.id}
                                    type="button"
                                    onClick={() =>
                                      updateImpactCard(card.id, {
                                        quadrant: targetQ.id,
                                      })
                                    }
                                    style={{
                                      padding: "2px 6px",
                                      fontSize: 10,
                                      fontWeight: active ? 700 : 500,
                                      borderRadius: 999,
                                      border: active
                                        ? `1px solid ${targetQ.badgeText}`
                                        : "1px solid #cbd5e1",
                                      background: active
                                        ? targetQ.badgeBg
                                        : "#f8fafc",
                                      color: active
                                        ? targetQ.badgeText
                                        : "#475569",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {targetQ.shortLabel}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: Lean Expérimentation & Tests Rapides */}
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#0f766e",
                  }}
                >
                  Étape 2 / 4 · Validation Terrain & Prototypage
                </span>
                <h3 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700 }}>
                  2. Lean Expérimentation & Tests Rapides
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Comment tester votre faisabilité et l&apos;adhésion client rapidement sans développer toute l&apos;infrastructure ?
                </p>
              </div>
              <button
                type="button"
                onClick={addExperiment}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #0B2545",
                  background: "#ffffff",
                  color: "#0B2545",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Ajouter un protocole de test
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {studio.experiments.map((exp, idx) => (
                <div
                  key={exp.id}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 14,
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong style={{ fontSize: 13, color: "#0B2545" }}>
                      Expérimentation #{idx + 1}
                    </strong>
                    {studio.experiments.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeExperiment(exp.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#b91c1c",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    ) : null}
                  </div>

                  {/* Quick Protocol Chips */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Format rapide :
                    </span>
                    {PROTOCOL_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          updateExperiment(exp.id, {
                            protocoleTest: exp.protocoleTest
                              ? `${exp.protocoleTest} · ${preset}`
                              : preset,
                          })
                        }
                        style={{
                          padding: "3px 8px",
                          fontSize: 11,
                          borderRadius: 999,
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Hypothèse technique / usage à vérifier
                      </span>
                      <input
                        type="text"
                        value={exp.hypothese}
                        onChange={(e) =>
                          updateExperiment(exp.id, {
                            hypothese: e.target.value,
                          })
                        }
                        placeholder="Ex : Les utilisateurs acceptent de scanner leur ordonnance / document"
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Protocole de test (comment tester en 1 semaine ?)
                      </span>
                      <input
                        type="text"
                        value={exp.protocoleTest}
                        onChange={(e) =>
                          updateExperiment(exp.id, {
                            protocoleTest: e.target.value,
                          })
                        }
                        placeholder="Ex : Maquette Figma + formulaire WhatsApp sur 15 étudiants"
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Indicateur mesuré (KPI)
                      </span>
                      <input
                        type="text"
                        value={exp.indicateurSucces}
                        onChange={(e) =>
                          updateExperiment(exp.id, {
                            indicateurSucces: e.target.value,
                          })
                        }
                        placeholder="Ex : Taux de complétion du parcours test"
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Seuil de validation (critère Go / No-Go)
                      </span>
                      <input
                        type="text"
                        value={exp.seuilValidation}
                        onChange={(e) =>
                          updateExperiment(exp.id, {
                            seuilValidation: e.target.value,
                          })
                        }
                        placeholder="Ex : Au moins 10/15 terminent le flux sans aide"
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Feuille de Route Produit (3 Jalons) */}
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6d28d9",
                }}
              >
                Étape 3 / 4 · Plan de Développement (12 Mois)
              </span>
              <h3 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700 }}>
                3. Feuille de Route Produit (3 Jalons : Court / Moyen / Long terme)
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                Structurez votre trajectoire réaliste sur 12 mois : du pilote initial au déploiement à l&apos;échelle.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 14,
              }}
            >
              {MILESTONE_DEFINITIONS.map((mDef) => {
                const mVal = studio.milestones[mDef.id];
                return (
                  <div
                    key={mDef.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderTop: `4px solid ${mDef.accent}`,
                      borderRadius: 10,
                      padding: 14,
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: mDef.accent,
                          textTransform: "uppercase",
                        }}
                      >
                        {mDef.horizon}
                      </span>
                      <h4
                        style={{
                          margin: "2px 0 0",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {mDef.title}
                      </h4>
                    </div>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Objectif prioritaire
                      </span>
                      <textarea
                        rows={2}
                        value={mVal.objectif}
                        onChange={(e) =>
                          updateMilestone(mDef.id, "objectif", e.target.value)
                        }
                        placeholder={mDef.placeholderObj}
                        className="eic-form-textarea"
                        style={{ fontSize: 13, minHeight: 58 }}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Livrable clé (technique / produit)
                      </span>
                      <input
                        type="text"
                        value={mVal.livrableCle}
                        onChange={(e) =>
                          updateMilestone(
                            mDef.id,
                            "livrableCle",
                            e.target.value,
                          )
                        }
                        placeholder={mDef.placeholderLivrable}
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        KPI de succès du jalon
                      </span>
                      <input
                        type="text"
                        value={mVal.kpi}
                        onChange={(e) =>
                          updateMilestone(mDef.id, "kpi", e.target.value)
                        }
                        placeholder={mDef.placeholderKpi}
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 4: Registre des Risques & Mitigation */}
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#b45309",
                  }}
                >
                  Étape 4 / 4 · Gestion des Risques & Conformité
                </span>
                <h3 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700 }}>
                  4. Registre des Risques & Mitigation
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Identifiez vos principaux risques (techniques, marché, réglementaires, opérationnels) et vos parades concrètes.
                </p>
              </div>
              <button
                type="button"
                onClick={addRisk}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #0B2545",
                  background: "#ffffff",
                  color: "#0B2545",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Ajouter un risque
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {studio.risks.map((risk, idx) => (
                <div
                  key={risk.id}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 14,
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <strong style={{ fontSize: 13, color: "#0B2545" }}>
                        Risque #{idx + 1}
                      </strong>

                      {/* Category pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {RISK_CATEGORIES.map((cat) => {
                          const active = risk.categorie === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() =>
                                updateRisk(risk.id, { categorie: cat.id })
                              }
                              style={{
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: active ? 700 : 500,
                                borderRadius: 999,
                                border: active
                                  ? `1px solid ${cat.badgeColor}`
                                  : "1px solid #cbd5e1",
                                background: active ? cat.badgeBg : "#ffffff",
                                color: active ? cat.badgeColor : "#475569",
                                cursor: "pointer",
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Level pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {RISK_LEVELS.map((lvl) => {
                          const active = risk.niveau === lvl.id;
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() =>
                                updateRisk(risk.id, { niveau: lvl.id })
                              }
                              style={{
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: active ? 700 : 500,
                                borderRadius: 999,
                                border: active
                                  ? `1px solid ${lvl.border}`
                                  : "1px solid #cbd5e1",
                                background: active ? lvl.bg : "#ffffff",
                                color: active ? lvl.color : "#475569",
                                cursor: "pointer",
                              }}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {studio.risks.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeRisk(risk.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#b91c1c",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Description du risque identifié
                      </span>
                      <input
                        type="text"
                        value={risk.risque}
                        onChange={(e) =>
                          updateRisk(risk.id, { risque: e.target.value })
                        }
                        placeholder="Ex : Protection des données personnelles (CNDP), dépendance API..."
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Plan de mitigation & action préventive
                      </span>
                      <input
                        type="text"
                        value={risk.mitigation}
                        onChange={(e) =>
                          updateRisk(risk.id, { mitigation: e.target.value })
                        }
                        placeholder="Ex : Anonymisation dès la collecte, hébergement souverain, solution de secours..."
                        className="eic-form-input"
                        style={{ fontSize: 13 }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Collapsible Markdown Preview */}
          <details
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Aperçu du livrable structuré qui sera transmis au Mentor (Markdown)
            </summary>
            <pre
              style={{
                marginTop: 10,
                padding: 12,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#0f172a",
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {serializedMarkdown}
            </pre>
          </details>

          {/* Submit Footer */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button
              type="submit"
              disabled={pending}
              className="eic-button--submit"
            >
              {pending ? t.submission_submitting : submitLabel}
            </button>
            <AutoSaveBadge lastSavedAt={lastSavedAt} />
          </div>

          {state.message ? (
            <p
              role={state.ok ? "status" : "alert"}
              style={{
                margin: 0,
                fontSize: 13,
                color: state.ok ? "#15803d" : "#b91c1c",
              }}
            >
              {state.ok
                ? t.submission_form_success_prefix
                : t.submission_form_error_prefix}
              {state.message}
            </p>
          ) : null}
        </form>
      )}

      {firstDelivery.triggered ? (
        <PixelMascotPlayer
          mood="euphorique"
          message={t.pixel_player_first_delivery_quote}
          onDismiss={firstDelivery.dismiss}
        />
      ) : null}
    </div>
  );
}
