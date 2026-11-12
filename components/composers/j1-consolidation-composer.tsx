"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";
import { AutoSaveBadge } from "@/components/auto-save-badge";
import { PixelMascotPlayer } from "@/components/pixel-mascot-player";
import { SubmissionForm } from "@/components/submission-form";
import { buildDraftStorageKey } from "@/hooks/use-auto-save";
import { useFirstDeliveryTrigger } from "@/hooks/use-pixel-trigger";
import { ANALYTICS_EVENTS, captureEvent } from "@/lib/analytics";
import { dictionaries } from "@/lib/i18n";

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

export type DimensionMaturityStatus =
  | "Solide & aligné"
  | "À préciser ce soir / J2 matin"
  | "Pivot / arbitrage requis";

export type ConsolidationDimensionItem = {
  id: string;
  dimension: string;
  status: DimensionMaturityStatus;
  pointCle: string;
};

export type MentoratJournalCard = {
  id: string;
  questionOuIncertitude: string;
  retourMentor: string;
  decisionEquipe: string;
};

export type PlanActionJ2Card = {
  id: string;
  prioriteRang: 1 | 2 | 3;
  livrableCible: string;
  actionAjustement: string;
  responsableEquipe: string;
};

type J1ConsolidationStudioState = {
  dimensions: ConsolidationDimensionItem[];
  mentoratCards: MentoratJournalCard[];
  planActionCards: PlanActionJ2Card[];
};

const MATURITY_STATUSES: DimensionMaturityStatus[] = [
  "Solide & aligné",
  "À préciser ce soir / J2 matin",
  "Pivot / arbitrage requis",
];

const MATURITY_STYLES: Record<
  DimensionMaturityStatus,
  { bg: string; border: string; text: string; badgeBg: string }
> = {
  "Solide & aligné": {
    bg: "#f0fdf4",
    border: "#86efac",
    text: "#166534",
    badgeBg: "#dcfce7",
  },
  "À préciser ce soir / J2 matin": {
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    badgeBg: "#fef3c7",
  },
  "Pivot / arbitrage requis": {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#991b1b",
    badgeBg: "#fee2e2",
  },
};

const DEFAULT_DIMENSIONS: ConsolidationDimensionItem[] = [
  {
    id: "dim-1",
    dimension: "Proposition de valeur & Problème client",
    status: "Solide & aligné",
    pointCle: "",
  },
  {
    id: "dim-2",
    dimension: "Modèle économique (BMC)",
    status: "À préciser ce soir / J2 matin",
    pointCle: "",
  },
  {
    id: "dim-3",
    dimension: "Équipe & Complémentarité des rôles",
    status: "Solide & aligné",
    pointCle: "",
  },
  {
    id: "dim-4",
    dimension: "Accès au marché & Go-to-Market",
    status: "À préciser ce soir / J2 matin",
    pointCle: "",
  },
  {
    id: "dim-5",
    dimension: "Faisabilité & Besoin de financement",
    status: "À préciser ce soir / J2 matin",
    pointCle: "",
  },
];

const DEFAULT_MENTORAT_CARDS: MentoratJournalCard[] = [
  {
    id: "mentor-1",
    questionOuIncertitude: "",
    retourMentor: "",
    decisionEquipe: "",
  },
  {
    id: "mentor-2",
    questionOuIncertitude: "",
    retourMentor: "",
    decisionEquipe: "",
  },
];

const DEFAULT_PLAN_ACTION_CARDS: PlanActionJ2Card[] = [
  {
    id: "prio-1",
    prioriteRang: 1,
    livrableCible: "",
    actionAjustement: "",
    responsableEquipe: "",
  },
  {
    id: "prio-2",
    prioriteRang: 2,
    livrableCible: "",
    actionAjustement: "",
    responsableEquipe: "",
  },
  {
    id: "prio-3",
    prioriteRang: 3,
    livrableCible: "",
    actionAjustement: "",
    responsableEquipe: "",
  },
];

function createDefaultState(): J1ConsolidationStudioState {
  return {
    dimensions: DEFAULT_DIMENSIONS.map((d) => ({ ...d })),
    mentoratCards: DEFAULT_MENTORAT_CARDS.map((m) => ({ ...m })),
    planActionCards: DEFAULT_PLAN_ACTION_CARDS.map((p) => ({ ...p })),
  };
}

function normalizeRanks(cards: PlanActionJ2Card[]): PlanActionJ2Card[] {
  return cards.map((card, idx) => ({
    ...card,
    prioriteRang: (idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3,
  }));
}

function serializeJ1ConsolidationMarkdown(
  title: string,
  studio: J1ConsolidationStudioState,
): string {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");

  // Section 1: 5 Dimensions
  lines.push("## 1. Bilan de Cohérence des 5 Dimensions (J1)");
  lines.push("");
  for (const item of studio.dimensions) {
    const point = item.pointCle.trim() || "_À compléter_";
    lines.push(`### ${item.dimension}`);
    lines.push(`- **Statut de maturité** : ${item.status}`);
    lines.push(`- **Point clé / enseignement** : ${point}`);
    lines.push("");
  }

  // Section 2: Journal de Mentorat
  lines.push("## 2. Journal de Mentorat : Incertitudes & Choix à Approfondir");
  lines.push("");
  const activeMentorCards = studio.mentoratCards.filter(
    (c) =>
      c.questionOuIncertitude.trim().length > 0 ||
      c.retourMentor.trim().length > 0 ||
      c.decisionEquipe.trim().length > 0,
  );
  if (activeMentorCards.length === 0) {
    lines.push("_Aucune note de mentorat renseignée pour le moment._");
    lines.push("");
  } else {
    activeMentorCards.forEach((card, index) => {
      lines.push(`### Point de mentorat #${index + 1}`);
      lines.push(
        `- **Question ou incertitude** : ${card.questionOuIncertitude.trim() || "_Non précisé_"}`,
      );
      lines.push(
        `- **Retour du mentor** : ${card.retourMentor.trim() || "_Non précisé_"}`,
      );
      lines.push(
        `- **Décision de l'équipe** : ${card.decisionEquipe.trim() || "_Non précisé_"}`,
      );
      lines.push("");
    });
  }

  // Section 3: Plan d'Action Priorisé du Jour 2
  lines.push("## 3. Plan d'Action Priorisé du Jour 2 (09h00–10h00 Point d'avancement)");
  lines.push("");
  const activeActionCards = studio.planActionCards.filter(
    (c) =>
      c.livrableCible.trim().length > 0 ||
      c.actionAjustement.trim().length > 0 ||
      c.responsableEquipe.trim().length > 0,
  );
  if (activeActionCards.length === 0) {
    lines.push("_Aucune priorité du Jour 2 renseignée pour le moment._");
    lines.push("");
  } else {
    studio.planActionCards.forEach((card, idx) => {
      const hasContent =
        card.livrableCible.trim().length > 0 ||
        card.actionAjustement.trim().length > 0 ||
        card.responsableEquipe.trim().length > 0;
      if (!hasContent) return;
      const rang = (idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3;
      lines.push(`### Priorité #${rang} (Rang ${card.prioriteRang || rang})`);
      lines.push(
        `- **Livrable / Canevas cible** : ${card.livrableCible.trim() || "_Non précisé_"}`,
      );
      lines.push(
        `- **Action d'ajustement prévue** : ${card.actionAjustement.trim() || "_Non précisé_"}`,
      );
      lines.push(
        `- **Responsable(s) équipe** : ${card.responsableEquipe.trim() || "_Non précisé_"}`,
      );
      lines.push("");
    });
  }

  return lines.join("\n").trim();
}

const initialWorkflowState: WorkflowState = { ok: false, message: "" };

export function J1ConsolidationComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "fallback">("studio");
  const [studio, setStudio] = useState<J1ConsolidationStudioState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  const [state, formAction, pending] = useActionState(
    submitDeliverable,
    initialWorkflowState,
  );
  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  const storageKey = useMemo(
    () => `${buildDraftStorageKey({ playerId, deliverableTemplateId, version })}_studio`,
    [playerId, deliverableTemplateId, version],
  );

  // Hydrate studio state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<J1ConsolidationStudioState>;
        setStudio((prev) => ({
          dimensions:
            Array.isArray(parsed.dimensions) && parsed.dimensions.length === 5
              ? parsed.dimensions.map((d, idx) => ({
                  id: typeof d.id === "string" ? d.id : DEFAULT_DIMENSIONS[idx].id,
                  dimension:
                    typeof d.dimension === "string"
                      ? d.dimension
                      : DEFAULT_DIMENSIONS[idx].dimension,
                  status: MATURITY_STATUSES.includes(d.status as DimensionMaturityStatus)
                    ? (d.status as DimensionMaturityStatus)
                    : DEFAULT_DIMENSIONS[idx].status,
                  pointCle: typeof d.pointCle === "string" ? d.pointCle : "",
                }))
              : prev.dimensions,
          mentoratCards:
            Array.isArray(parsed.mentoratCards) && parsed.mentoratCards.length > 0
              ? parsed.mentoratCards.map((m, idx) => ({
                  id: typeof m.id === "string" ? m.id : `mentor-${idx + 1}`,
                  questionOuIncertitude:
                    typeof m.questionOuIncertitude === "string"
                      ? m.questionOuIncertitude
                      : "",
                  retourMentor:
                    typeof m.retourMentor === "string" ? m.retourMentor : "",
                  decisionEquipe:
                    typeof m.decisionEquipe === "string" ? m.decisionEquipe : "",
                }))
              : prev.mentoratCards,
          planActionCards:
            Array.isArray(parsed.planActionCards) && parsed.planActionCards.length > 0
              ? normalizeRanks(
                  parsed.planActionCards.map((p, idx) => ({
                    id: typeof p.id === "string" ? p.id : `prio-${idx + 1}`,
                    prioriteRang: (idx === 0 ? 1 : idx === 1 ? 2 : 3) as 1 | 2 | 3,
                    livrableCible:
                      typeof p.livrableCible === "string" ? p.livrableCible : "",
                    actionAjustement:
                      typeof p.actionAjustement === "string" ? p.actionAjustement : "",
                    responsableEquipe:
                      typeof p.responsableEquipe === "string" ? p.responsableEquipe : "",
                  })),
                )
              : prev.planActionCards,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore malformed JSON or storage errors
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Auto-save studio state to localStorage on change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Ignore quota or private mode issues
    }
  }, [studio, hydrated, storageKey]);

  // Handle successful submission
  useEffect(() => {
    if (state.ok) {
      captureEvent(ANALYTICS_EVENTS.eg_deliverable_submitted, {
        deliverableTemplateId,
        version,
      });
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // Ignore storage removal errors
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, storageKey, router]);

  // Section completion indicators (R2 warn-only, never blocking)
  const filledDimensionsCount = useMemo(
    () => studio.dimensions.filter((d) => d.pointCle.trim().length > 0).length,
    [studio.dimensions],
  );
  const filledMentorCardsCount = useMemo(
    () =>
      studio.mentoratCards.filter(
        (m) =>
          m.questionOuIncertitude.trim().length > 0 ||
          m.retourMentor.trim().length > 0 ||
          m.decisionEquipe.trim().length > 0,
      ).length,
    [studio.mentoratCards],
  );
  const filledPlanActionCount = useMemo(
    () =>
      studio.planActionCards.filter(
        (p) =>
          p.livrableCible.trim().length > 0 ||
          p.actionAjustement.trim().length > 0 ||
          p.responsableEquipe.trim().length > 0,
      ).length,
    [studio.planActionCards],
  );

  const completedSectionsCount =
    (filledDimensionsCount > 0 ? 1 : 0) +
    (filledMentorCardsCount > 0 ? 1 : 0) +
    (filledPlanActionCount > 0 ? 1 : 0);

  const serializedMarkdown = useMemo(
    () => serializeJ1ConsolidationMarkdown(deliverableTitle, studio),
    [deliverableTitle, studio],
  );

  // Handlers for Section 1 (5 Dimensions)
  const updateDimensionStatus = (id: string, status: DimensionMaturityStatus) => {
    setStudio((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
  };

  const updateDimensionPointCle = (id: string, pointCle: string) => {
    setStudio((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((d) => (d.id === id ? { ...d, pointCle } : d)),
    }));
  };

  // Handlers for Section 2 (Journal de Mentorat)
  const updateMentorCard = (
    id: string,
    field: keyof Omit<MentoratJournalCard, "id">,
    value: string,
  ) => {
    setStudio((prev) => ({
      ...prev,
      mentoratCards: prev.mentoratCards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card,
      ),
    }));
  };

  const addMentorCard = () => {
    setStudio((prev) => ({
      ...prev,
      mentoratCards: [
        ...prev.mentoratCards,
        {
          id: `mentor-${Date.now()}`,
          questionOuIncertitude: "",
          retourMentor: "",
          decisionEquipe: "",
        },
      ],
    }));
  };

  const removeMentorCard = (id: string) => {
    setStudio((prev) => {
      if (prev.mentoratCards.length <= 1) return prev;
      return {
        ...prev,
        mentoratCards: prev.mentoratCards.filter((card) => card.id !== id),
      };
    });
  };

  // Handlers for Section 3 (Plan d'Action Priorisé J2)
  const updatePlanActionCard = (
    id: string,
    field: keyof Omit<PlanActionJ2Card, "id" | "prioriteRang">,
    value: string,
  ) => {
    setStudio((prev) => ({
      ...prev,
      planActionCards: prev.planActionCards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card,
      ),
    }));
  };

  const movePlanActionCard = (index: number, direction: -1 | 1) => {
    setStudio((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.planActionCards.length) {
        return prev;
      }
      const next = [...prev.planActionCards];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return {
        ...prev,
        planActionCards: normalizeRanks(next),
      };
    });
  };

  const submitLabel = version === 2 ? t.submission_v2_submit : t.submission_submit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
      {/* Mode Switcher Header */}
      <div
        role="tablist"
        aria-label="Mode de saisie du livrable"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 6,
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "studio"}
          onClick={() => setMode("studio")}
          style={{
            flex: "1 1 auto",
            padding: "10px 14px",
            borderRadius: 8,
            border: mode === "studio" ? "1px solid #0f172a" : "1px solid transparent",
            backgroundColor: mode === "studio" ? "#0f172a" : "transparent",
            color: mode === "studio" ? "#ffffff" : "#334155",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Tableau de consolidation interactif (recommandé)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "fallback"}
          onClick={() => setMode("fallback")}
          style={{
            flex: "1 1 auto",
            padding: "10px 14px",
            borderRadius: 8,
            border: mode === "fallback" ? "1px solid #0f172a" : "1px solid transparent",
            backgroundColor: mode === "fallback" ? "#0f172a" : "transparent",
            color: mode === "fallback" ? "#ffffff" : "#334155",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Lien externe / Texte libre
        </button>
      </div>

      {mode === "fallback" ? (
        <SubmissionForm
          deliverableTemplateId={deliverableTemplateId}
          playerId={playerId}
          version={version}
        />
      ) : (
        <>
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

            {/* R2 Warn-only Pedagogical Progress Banner */}
            <div
              role="status"
              aria-live="polite"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                backgroundColor: completedSectionsCount === 3 ? "#f0fdf4" : "#fffbeb",
                border:
                  completedSectionsCount === 3
                    ? "1px solid #bbf7d0"
                    : "1px solid #fde68a",
                color: completedSectionsCount === 3 ? "#166534" : "#92400e",
                fontSize: 13,
              }}
            >
              <div>
                <strong>Repère pédagogique (indicatif) :</strong>{" "}
                {completedSectionsCount}/3 volets renseignés ({filledDimensionsCount}/5
                dimensions · {filledMentorCardsCount} point(s) mentorat ·{" "}
                {filledPlanActionCount}/3 priorités J2).
              </div>
              <span style={{ fontSize: 12, opacity: 0.9 }}>
                {completedSectionsCount === 3
                  ? "Prêt pour le point d'avancement J2"
                  : "Vous pouvez soumettre à tout moment (non bloquant)"}
              </span>
            </div>

            {/* SECTION 1: Bilan de Cohérence des 5 Dimensions */}
            <section
              aria-labelledby="j1-consolidation-sec1"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: 18,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#64748b",
                  }}
                >
                  Volet 1 · Alignement Global Fin de Jour 1
                </span>
                <h3
                  id="j1-consolidation-sec1"
                  style={{ margin: "4px 0 4px", fontSize: 16, fontWeight: 700 }}
                >
                  1. Bilan de Cohérence des 5 Dimensions
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Évaluez la maturité actuelle de chaque pilier travaillé aujourd&apos;hui et
                  notez l&apos;enseignement principal retenu par l&apos;équipe.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {studio.dimensions.map((item, idx) => {
                  const stylePalette = MATURITY_STYLES[item.status];
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        padding: 14,
                        borderRadius: 10,
                        border: `1px solid ${stylePalette.border}`,
                        backgroundColor: stylePalette.bg,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <strong style={{ fontSize: 14, color: "#0f172a" }}>
                          {idx + 1}. {item.dimension}
                        </strong>
                        <div
                          role="group"
                          aria-label={`Maturité pour ${item.dimension}`}
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {MATURITY_STATUSES.map((statusOption) => {
                            const selected = item.status === statusOption;
                            return (
                              <button
                                key={statusOption}
                                type="button"
                                onClick={() => updateDimensionStatus(item.id, statusOption)}
                                aria-pressed={selected}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: selected ? 700 : 500,
                                  border: selected
                                    ? "1px solid #0f172a"
                                    : "1px solid #cbd5e1",
                                  backgroundColor: selected ? "#0f172a" : "#ffffff",
                                  color: selected ? "#ffffff" : "#334155",
                                  cursor: "pointer",
                                }}
                              >
                                {statusOption}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Point clé / enseignement consolidé</span>
                        <textarea
                          rows={2}
                          value={item.pointCle}
                          onChange={(e) =>
                            updateDimensionPointCle(item.id, e.target.value)
                          }
                          placeholder="Ex : Le segment initial a été resserré sur les jeunes actifs urbains suite au BMC..."
                          className="eic-form-textarea"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 2: Journal de Mentorat */}
            <section
              aria-labelledby="j1-consolidation-sec2"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: 18,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#64748b",
                    }}
                  >
                    Volet 2 · Session Mentorat 16h30–17h30
                  </span>
                  <h3
                    id="j1-consolidation-sec2"
                    style={{ margin: "4px 0 4px", fontSize: 16, fontWeight: 700 }}
                  >
                    2. Journal de Mentorat : Incertitudes &amp; Choix à Approfondir
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                    Capturez les questions posées au mentor, ses retours clés et la décision
                    prise par votre équipe.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMentorCard}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #0f172a",
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter un point de mentorat
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {studio.mentoratCards.map((card, index) => (
                  <div
                    key={card.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong style={{ fontSize: 13, color: "#0f172a" }}>
                        Échange mentorat #{index + 1}
                      </strong>
                      {studio.mentoratCards.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeMentorCard(card.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #fecaca",
                            backgroundColor: "#fff1f2",
                            color: "#be123c",
                            fontSize: 11,
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
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Question ou incertitude identifiée</span>
                        <textarea
                          rows={2}
                          value={card.questionOuIncertitude}
                          onChange={(e) =>
                            updateMentorCard(
                              card.id,
                              "questionOuIncertitude",
                              e.target.value,
                            )
                          }
                          placeholder="Ex : Faut-il facturer à l'abonnement ou à la commission dès le lancement ?"
                          className="eic-form-textarea"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Retour / conseil du mentor</span>
                        <textarea
                          rows={2}
                          value={card.retourMentor}
                          onChange={(e) =>
                            updateMentorCard(card.id, "retourMentor", e.target.value)
                          }
                          placeholder="Ex : Tester un abonnement pilote simple sur 10 clients B2B avant toute commission."
                          className="eic-form-textarea"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Décision / arbitrage de l&apos;équipe</span>
                        <textarea
                          rows={2}
                          value={card.decisionEquipe}
                          onChange={(e) =>
                            updateMentorCard(card.id, "decisionEquipe", e.target.value)
                          }
                          placeholder="Ex : On simplifie l'offre à un forfait mensuel unique dans le BMC et le plan financier."
                          className="eic-form-textarea"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 3: Plan d'Action Priorisé du Jour 2 */}
            <section
              aria-labelledby="j1-consolidation-sec3"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: 18,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#64748b",
                  }}
                >
                  Volet 3 · Feuille de Route J2 (09h00–10h00 Point d&apos;avancement)
                </span>
                <h3
                  id="j1-consolidation-sec3"
                  style={{ margin: "4px 0 4px", fontSize: 16, fontWeight: 700 }}
                >
                  3. Plan d&apos;Action Priorisé du Jour 2
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Ordonnez vos 3 priorités d&apos;ajustement pour demain matin avec les boutons
                  de réorganisation (↑ / ↓).
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {studio.planActionCards.map((card, index) => (
                  <div
                    key={card.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 999,
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Priorité #{card.prioriteRang}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => movePlanActionCard(index, -1)}
                          disabled={index === 0}
                          aria-label={`Monter la priorité ${card.prioriteRang}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            backgroundColor: index === 0 ? "#f1f5f9" : "#ffffff",
                            color: index === 0 ? "#94a3b8" : "#0f172a",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: index === 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          ↑ Monter
                        </button>
                        <button
                          type="button"
                          onClick={() => movePlanActionCard(index, 1)}
                          disabled={index === studio.planActionCards.length - 1}
                          aria-label={`Descendre la priorité ${card.prioriteRang}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            backgroundColor:
                              index === studio.planActionCards.length - 1
                                ? "#f1f5f9"
                                : "#ffffff",
                            color:
                              index === studio.planActionCards.length - 1
                                ? "#94a3b8"
                                : "#0f172a",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor:
                              index === studio.planActionCards.length - 1
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          ↓ Descendre
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Livrable / Canevas cible</span>
                        <input
                          type="text"
                          value={card.livrableCible}
                          onChange={(e) =>
                            updatePlanActionCard(card.id, "livrableCible", e.target.value)
                          }
                          placeholder="Ex : BMC & Besoin de financement"
                          className="eic-form-input"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Action d&apos;ajustement concrète</span>
                        <input
                          type="text"
                          value={card.actionAjustement}
                          onChange={(e) =>
                            updatePlanActionCard(
                              card.id,
                              "actionAjustement",
                              e.target.value,
                            )
                          }
                          placeholder="Ex : Recalculer le coût d'acquisition et la marge unitaire"
                          className="eic-form-input"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <span>Responsable(s) dans l&apos;équipe</span>
                        <input
                          type="text"
                          value={card.responsableEquipe}
                          onChange={(e) =>
                            updatePlanActionCard(
                              card.id,
                              "responsableEquipe",
                              e.target.value,
                            )
                          }
                          placeholder="Ex : Yasmine & Mehdi"
                          className="eic-form-input"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Collapsible Markdown Summary Preview */}
            <div
              style={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                padding: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setShowMarkdownPreview((prev) => !prev)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                {showMarkdownPreview
                  ? "▼ Masquer l'aperçu de la synthèse générée"
                  : "▶ Voir l'aperçu de la synthèse générée (Markdown)"}
              </button>
              {showMarkdownPreview ? (
                <pre
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {serializedMarkdown}
                </pre>
              ) : null}
            </div>

            {/* Footer: Submit + AutoSaveBadge + Status Message */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                type="submit"
                disabled={pending}
                className="eic-button--submit"
              >
                {pending ? t.submission_submitting : submitLabel}
              </button>

              <AutoSaveBadge lastSavedAt={lastSavedAt} />

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
            </div>
          </form>

          {firstDelivery.triggered ? (
            <PixelMascotPlayer
              mood="euphorique"
              message={t.pixel_player_first_delivery_quote}
              onDismiss={firstDelivery.dismiss}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
