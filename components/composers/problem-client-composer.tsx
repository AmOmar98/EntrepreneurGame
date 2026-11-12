"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";
import { ANALYTICS_EVENTS, captureEvent } from "@/lib/analytics";
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

export type NeedIntensity = "critique" | "majeur" | "modere";

export type NeedCard = {
  id: string;
  besoin: string;
  partiePrenante: string;
  intensite: NeedIntensity;
  frequence: string;
};

export type AlternativeRow = {
  id: string;
  alternative: string;
  pourquoiInsuffisant: string;
};

export type HypothesisPriority = "critique" | "secondaire";

export type HypothesisCard = {
  id: string;
  hypothese: string;
  questionEntretien: string;
  critereValidation: string;
  priorite: HypothesisPriority;
};

type ProblemClientStudioState = {
  segmentPrincipal: string;
  contexteUsage: string;
  besoins: NeedCard[];
  alternatives: AlternativeRow[];
  hypotheses: HypothesisCard[];
  syntheseBesoin: string;
  solutionProposee: string;
};

const INTENSITY_META: Record<
  NeedIntensity,
  { label: string; bg: string; color: string; border: string; next: NeedIntensity }
> = {
  critique: {
    label: "Critique",
    bg: "#FEE2E2",
    color: "#991B1B",
    border: "#FCA5A5",
    next: "majeur",
  },
  majeur: {
    label: "Majeur",
    bg: "#FEF3C7",
    color: "#92400E",
    border: "#FCD34D",
    next: "modere",
  },
  modere: {
    label: "Modéré",
    bg: "#E0F2FE",
    color: "#075985",
    border: "#7DD3FC",
    next: "critique",
  },
};

function createInitialStudioState(): ProblemClientStudioState {
  return {
    segmentPrincipal: "",
    contexteUsage: "",
    besoins: [
      {
        id: "need-1",
        besoin: "",
        partiePrenante: "",
        intensite: "critique",
        frequence: "",
      },
      {
        id: "need-2",
        besoin: "",
        partiePrenante: "",
        intensite: "majeur",
        frequence: "",
      },
    ],
    alternatives: [
      {
        id: "alt-1",
        alternative: "",
        pourquoiInsuffisant: "",
      },
      {
        id: "alt-2",
        alternative: "",
        pourquoiInsuffisant: "",
      },
    ],
    hypotheses: [
      {
        id: "hyp-1",
        hypothese: "",
        questionEntretien: "",
        critereValidation: "",
        priorite: "critique",
      },
      {
        id: "hyp-2",
        hypothese: "",
        questionEntretien: "",
        critereValidation: "",
        priorite: "secondaire",
      },
    ],
    syntheseBesoin: "",
    solutionProposee: "",
  };
}

function serializeStudioToMarkdown(
  deliverableTitle: string,
  studio: ProblemClientStudioState
): string {
  const lines: string[] = [];

  const seg = studio.segmentPrincipal.trim();
  const ctx = studio.contexteUsage.trim();
  const filledNeeds = studio.besoins.filter(
    (b) =>
      b.besoin.trim().length > 0 ||
      b.partiePrenante.trim().length > 0 ||
      b.frequence.trim().length > 0
  );
  const filledAlternatives = studio.alternatives.filter(
    (a) => a.alternative.trim().length > 0 || a.pourquoiInsuffisant.trim().length > 0
  );
  const filledHypotheses = studio.hypotheses.filter(
    (h) =>
      h.hypothese.trim().length > 0 ||
      h.questionEntretien.trim().length > 0 ||
      h.critereValidation.trim().length > 0
  );
  const synthese = studio.syntheseBesoin.trim();
  const solution = studio.solutionProposee.trim();

  const hasAnyContent =
    seg.length > 0 ||
    ctx.length > 0 ||
    filledNeeds.length > 0 ||
    filledAlternatives.length > 0 ||
    filledHypotheses.length > 0 ||
    synthese.length > 0 ||
    solution.length > 0;

  if (!hasAnyContent) {
    return "";
  }

  lines.push(`# ${deliverableTitle}`);
  lines.push("");

  lines.push("## 1. Segment Client & Persona Cible");
  lines.push(`- **Segment principal (B2C / B2B)** : ${seg || "_Non renseigné_"}`);
  lines.push(`- **Contexte d'usage & déclencheur** : ${ctx || "_Non renseigné_"}`);
  lines.push("");

  lines.push("## 2. Besoins Non Satisfaits & Parties Prenantes");
  if (filledNeeds.length === 0) {
    lines.push("_Aucune carte de besoin renseignée._");
  } else {
    filledNeeds.forEach((n, idx) => {
      const badge = INTENSITY_META[n.intensite]?.label ?? n.intensite;
      lines.push(
        `${idx + 1}. **[${badge}] ${n.besoin.trim() || "Besoin à préciser"}**`
      );
      if (n.partiePrenante.trim()) {
        lines.push(`   - Partie prenante : ${n.partiePrenante.trim()}`);
      }
      if (n.frequence.trim()) {
        lines.push(`   - Fréquence / impact : ${n.frequence.trim()}`);
      }
    });
  }
  lines.push("");

  lines.push("## 3. Alternatives Actuelles & Limites");
  if (filledAlternatives.length === 0) {
    lines.push("_Aucune alternative actuelle renseignée._");
  } else {
    filledAlternatives.forEach((alt, idx) => {
      lines.push(
        `${idx + 1}. **Alternative actuelle** : ${alt.alternative.trim() || "_À préciser_"}`
      );
      lines.push(
        `   - **Pourquoi c'est insuffisant** : ${alt.pourquoiInsuffisant.trim() || "_À préciser_"}`
      );
    });
  }
  lines.push("");

  lines.push("## 4. Matrice d'Hypothèses Prioritaires & Guide d'Entretien");
  const critHyps = filledHypotheses.filter((h) => h.priorite === "critique");
  const secHyps = filledHypotheses.filter((h) => h.priorite === "secondaire");

  lines.push("### 🔥 Hypothèses Critiques (à tester en priorité)");
  if (critHyps.length === 0) {
    lines.push("_Aucune hypothèse critique renseignée._");
  } else {
    critHyps.forEach((h, idx) => {
      lines.push(`${idx + 1}. **Hypothèse** : ${h.hypothese.trim() || "_À préciser_"}`);
      if (h.questionEntretien.trim()) {
        lines.push(`   - Question d'entretien : « ${h.questionEntretien.trim()} »`);
      }
      if (h.critereValidation.trim()) {
        lines.push(`   - Critère de validation : ${h.critereValidation.trim()}`);
      }
    });
  }
  lines.push("");

  lines.push("### 🧪 Hypothèses Secondaires");
  if (secHyps.length === 0) {
    lines.push("_Aucune hypothèse secondaire renseignée._");
  } else {
    secHyps.forEach((h, idx) => {
      lines.push(`${idx + 1}. **Hypothèse** : ${h.hypothese.trim() || "_À préciser_"}`);
      if (h.questionEntretien.trim()) {
        lines.push(`   - Question d'entretien : « ${h.questionEntretien.trim()} »`);
      }
      if (h.critereValidation.trim()) {
        lines.push(`   - Critère de validation : ${h.critereValidation.trim()}`);
      }
    });
  }
  lines.push("");

  lines.push("## 5. Synthèse du Besoin Identifié & Solution Proposée");
  lines.push(`- **Synthèse du besoin identifié** : ${synthese || "_Non renseigné_"}`);
  lines.push(`- **Solution proposée** : ${solution || "_Non renseigné_"}`);

  return lines.join("\n").slice(0, 3950);
}

const initialActionState: WorkflowState = { ok: false, message: "" };

export function ProblemClientComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
  initialProofText,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "classic">("studio");
  const [studio, setStudio] = useState<ProblemClientStudioState>(
    createInitialStudioState
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const hydratedRef = useRef(false);

  const storageKey = useMemo(
    () =>
      `${buildDraftStorageKey({
        playerId,
        deliverableTemplateId,
        version,
      })}_studio`,
    [playerId, deliverableTemplateId, version]
  );

  const [state, formAction, pending] = useActionState(
    submitDeliverable,
    initialActionState
  );
  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  // Hydrate studio state on mount from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProblemClientStudioState>;
        setStudio((prev) => ({
          segmentPrincipal:
            typeof parsed.segmentPrincipal === "string"
              ? parsed.segmentPrincipal
              : prev.segmentPrincipal,
          contexteUsage:
            typeof parsed.contexteUsage === "string"
              ? parsed.contexteUsage
              : prev.contexteUsage,
          besoins:
            Array.isArray(parsed.besoins) && parsed.besoins.length > 0
              ? parsed.besoins.map((b, i) => ({
                  id: typeof b.id === "string" ? b.id : `need-${i + 1}`,
                  besoin: typeof b.besoin === "string" ? b.besoin : "",
                  partiePrenante:
                    typeof b.partiePrenante === "string" ? b.partiePrenante : "",
                  intensite:
                    b.intensite === "critique" ||
                    b.intensite === "majeur" ||
                    b.intensite === "modere"
                      ? b.intensite
                      : "majeur",
                  frequence: typeof b.frequence === "string" ? b.frequence : "",
                }))
              : prev.besoins,
          alternatives:
            Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0
              ? parsed.alternatives.map((a, i) => ({
                  id: typeof a.id === "string" ? a.id : `alt-${i + 1}`,
                  alternative:
                    typeof a.alternative === "string" ? a.alternative : "",
                  pourquoiInsuffisant:
                    typeof a.pourquoiInsuffisant === "string"
                      ? a.pourquoiInsuffisant
                      : "",
                }))
              : prev.alternatives,
          hypotheses:
            Array.isArray(parsed.hypotheses) && parsed.hypotheses.length > 0
              ? parsed.hypotheses.map((h, i) => ({
                  id: typeof h.id === "string" ? h.id : `hyp-${i + 1}`,
                  hypothese: typeof h.hypothese === "string" ? h.hypothese : "",
                  questionEntretien:
                    typeof h.questionEntretien === "string"
                      ? h.questionEntretien
                      : "",
                  critereValidation:
                    typeof h.critereValidation === "string"
                      ? h.critereValidation
                      : "",
                  priorite:
                    h.priorite === "critique" || h.priorite === "secondaire"
                      ? h.priorite
                      : "critique",
                }))
              : prev.hypotheses,
          syntheseBesoin:
            typeof parsed.syntheseBesoin === "string"
              ? parsed.syntheseBesoin
              : prev.syntheseBesoin,
          solutionProposee:
            typeof parsed.solutionProposee === "string"
              ? parsed.solutionProposee
              : prev.solutionProposee,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore storage errors
    } finally {
      hydratedRef.current = true;
    }
  }, [storageKey]);

  // Auto-save studio state to localStorage on every change after hydration
  useEffect(() => {
    if (typeof window === "undefined" || !hydratedRef.current) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Ignore quota / privacy mode errors
    }
  }, [studio, storageKey]);

  // On successful submit: analytics, clear draft, refresh route
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
          // Ignore storage errors
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, storageKey, router]);

  const serializedMarkdown = useMemo(
    () => serializeStudioToMarkdown(deliverableTitle, studio),
    [deliverableTitle, studio]
  );

  // Pedagogical warn-only section completion (R2)
  const sectionCompletion = useMemo(() => {
    const s1 =
      studio.segmentPrincipal.trim().length > 0 ||
      studio.contexteUsage.trim().length > 0;
    const s2 = studio.besoins.some(
      (b) => b.besoin.trim().length > 0 || b.partiePrenante.trim().length > 0
    );
    const s3 = studio.alternatives.some(
      (a) =>
        a.alternative.trim().length > 0 ||
        a.pourquoiInsuffisant.trim().length > 0
    );
    const s4 = studio.hypotheses.some(
      (h) =>
        h.hypothese.trim().length > 0 || h.questionEntretien.trim().length > 0
    );
    const s5 =
      studio.syntheseBesoin.trim().length > 0 ||
      studio.solutionProposee.trim().length > 0;

    const flags = [
      { num: 1, label: "Segment & Persona", done: s1 },
      { num: 2, label: "Besoins & Parties prenantes", done: s2 },
      { num: 3, label: "Alternatives actuelles", done: s3 },
      { num: 4, label: "Matrice d'hypothèses", done: s4 },
      { num: 5, label: "Synthèse & Solution", done: s5 },
    ];
    const completedCount = flags.filter((f) => f.done).length;
    return { flags, completedCount, total: 5 };
  }, [studio]);

  // Handlers for Section 2: Need Cards
  const addNeedCard = () => {
    setStudio((prev) => ({
      ...prev,
      besoins: [
        ...prev.besoins,
        {
          id: `need-${Date.now()}-${prev.besoins.length + 1}`,
          besoin: "",
          partiePrenante: "",
          intensite: "majeur",
          frequence: "",
        },
      ],
    }));
  };

  const updateNeedCard = (id: string, patch: Partial<NeedCard>) => {
    setStudio((prev) => ({
      ...prev,
      besoins: prev.besoins.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const removeNeedCard = (id: string) => {
    setStudio((prev) => ({
      ...prev,
      besoins:
        prev.besoins.length > 1
          ? prev.besoins.filter((b) => b.id !== id)
          : [
              {
                id: "need-1",
                besoin: "",
                partiePrenante: "",
                intensite: "critique",
                frequence: "",
              },
            ],
    }));
  };

  const moveNeedCard = (index: number, direction: -1 | 1) => {
    setStudio((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.besoins.length) return prev;
      const next = [...prev.besoins];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, besoins: next };
    });
  };

  // Handlers for Section 3: Alternatives
  const addAlternativeRow = () => {
    setStudio((prev) => ({
      ...prev,
      alternatives: [
        ...prev.alternatives,
        {
          id: `alt-${Date.now()}-${prev.alternatives.length + 1}`,
          alternative: "",
          pourquoiInsuffisant: "",
        },
      ],
    }));
  };

  const updateAlternativeRow = (id: string, patch: Partial<AlternativeRow>) => {
    setStudio((prev) => ({
      ...prev,
      alternatives: prev.alternatives.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    }));
  };

  const removeAlternativeRow = (id: string) => {
    setStudio((prev) => ({
      ...prev,
      alternatives:
        prev.alternatives.length > 1
          ? prev.alternatives.filter((a) => a.id !== id)
          : [{ id: "alt-1", alternative: "", pourquoiInsuffisant: "" }],
    }));
  };

  // Handlers for Section 4: Hypothesis Matrix (2-Column Board)
  const addHypothesisCard = (priorite: HypothesisPriority) => {
    setStudio((prev) => ({
      ...prev,
      hypotheses: [
        ...prev.hypotheses,
        {
          id: `hyp-${Date.now()}-${prev.hypotheses.length + 1}`,
          hypothese: "",
          questionEntretien: "",
          critereValidation: "",
          priorite,
        },
      ],
    }));
  };

  const updateHypothesisCard = (id: string, patch: Partial<HypothesisCard>) => {
    setStudio((prev) => ({
      ...prev,
      hypotheses: prev.hypotheses.map((h) =>
        h.id === id ? { ...h, ...patch } : h
      ),
    }));
  };

  const toggleHypothesisPriority = (id: string) => {
    setStudio((prev) => ({
      ...prev,
      hypotheses: prev.hypotheses.map((h) =>
        h.id === id
          ? {
              ...h,
              priorite: h.priorite === "critique" ? "secondaire" : "critique",
            }
          : h
      ),
    }));
  };

  const removeHypothesisCard = (id: string) => {
    setStudio((prev) => ({
      ...prev,
      hypotheses:
        prev.hypotheses.length > 1
          ? prev.hypotheses.filter((h) => h.id !== id)
          : [
              {
                id: "hyp-1",
                hypothese: "",
                questionEntretien: "",
                critereValidation: "",
                priorite: "critique",
              },
            ],
    }));
  };

  const submitLabel =
    version === 2 ? t.submission_v2_submit : t.submission_submit;

  const criticalHypotheses = studio.hypotheses.filter(
    (h) => h.priorite === "critique"
  );
  const secondaryHypotheses = studio.hypotheses.filter(
    (h) => h.priorite === "secondaire"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
      {/* 1. Mode Switcher Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#0B2545",
            }}
          >
            Mode de réalisation du livrable
          </span>
          <span style={{ fontSize: 13, color: "#6B7280" }}>
            Construisez votre fiche problème-client directement dans l&apos;atelier ou déposez un lien externe.
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Mode de soumission"
          style={{
            display: "inline-flex",
            gap: 6,
            padding: 4,
            background: "#F3F4F6",
            borderRadius: 999,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "studio"}
            onClick={() => setMode("studio")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "studio" ? "#0B2545" : "transparent",
              color: mode === "studio" ? "#FFFFFF" : "#374151",
              transition: "all 0.15s ease",
            }}
          >
            Atelier interactif (recommandé)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "classic"}
            onClick={() => setMode("classic")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "classic" ? "#0B2545" : "transparent",
              color: mode === "classic" ? "#FFFFFF" : "#374151",
              transition: "all 0.15s ease",
            }}
          >
            Lien externe / Texte libre
          </button>
        </div>
      </div>

      {mode === "classic" ? (
        <SubmissionForm
          deliverableTemplateId={deliverableTemplateId}
          playerId={playerId}
          version={version}
        />
      ) : (
        <>
          {initialProofText && version === 2 ? (
            <details
              style={{
                padding: "12px 16px",
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                borderRadius: 10,
                fontSize: 13,
                color: "#92400E",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                Voir votre soumission V1 précédente (référence)
              </summary>
              <pre
                style={{
                  marginTop: 8,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: 12,
                  background: "#FFFBEB",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #FDE68A",
                }}
              >
                {initialProofText}
              </pre>
            </details>
          ) : null}

          {/* R2 Warn-only pedagogical progress indicator */}
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "14px 16px",
              background:
                sectionCompletion.completedCount === sectionCompletion.total
                  ? "#F0FDF4"
                  : "#FFFBEB",
              border: `1px solid ${
                sectionCompletion.completedCount === sectionCompletion.total
                  ? "#BBF7D0"
                  : "#FDE68A"
              }`,
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
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
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    sectionCompletion.completedCount === sectionCompletion.total
                      ? "#166534"
                      : "#92400E",
                }}
              >
                Progression de la fiche : {sectionCompletion.completedCount} /{" "}
                {sectionCompletion.total} blocs complétés (indicatif — non bloquant)
              </span>
              <AutoSaveBadge lastSavedAt={lastSavedAt} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sectionCompletion.flags.map((f) => (
                <span
                  key={f.num}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: f.done ? "#DCFCE7" : "#FEF3C7",
                    color: f.done ? "#166534" : "#92400E",
                    border: `1px solid ${f.done ? "#86EFAC" : "#FCD34D"}`,
                  }}
                >
                  {f.done ? "✓" : "○"} {f.num}. {f.label}
                </span>
              ))}
            </div>
          </div>

          <form
            action={formAction}
            style={{ display: "flex", flexDirection: "column", gap: 22 }}
          >
            <input
              type="hidden"
              name="deliverableTemplateId"
              value={deliverableTemplateId}
            />
            <input type="hidden" name="kind" value="proof_text" />
            <input type="hidden" name="proofText" value={serializedMarkdown} />

            {/* SECTION 1: Segment Client & Persona Cible */}
            <section
              style={{
                padding: 20,
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: "#0B2545" }}>
                  1. Segment Client &amp; Persona Cible
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                  Identifiez précisément qui vit le problème au quotidien et dans quel contexte précis il apparaît.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    Segment principal (qui est le client cible B2C / B2B ?)
                  </span>
                  <textarea
                    rows={3}
                    value={studio.segmentPrincipal}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        segmentPrincipal: e.target.value,
                      }))
                    }
                    placeholder="Ex: Étudiants de 18-24 ans à Fès cherchant un stage ou un logement abordable..."
                    className="eic-form-textarea"
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    Contexte d&apos;usage (dans quelle situation vit-il le problème ?)
                  </span>
                  <textarea
                    rows={3}
                    value={studio.contexteUsage}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        contexteUsage: e.target.value,
                      }))
                    }
                    placeholder="Ex: En début de semestre ou lors d'une urgence médicale / administrative sans relais..."
                    className="eic-form-textarea"
                  />
                </label>
              </div>
            </section>

            {/* SECTION 2: Cartes des Besoins Non Satisfaits & Parties Prenantes */}
            <section
              style={{
                padding: 20,
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 14,
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
                  <h3 style={{ margin: 0, fontSize: 16, color: "#0B2545" }}>
                    2. Cartes des Besoins Non Satisfaits &amp; Parties Prenantes
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                    Ajoutez les irritants majeurs. Cliquez sur le badge d&apos;intensité (Critique / Majeur / Modéré) pour le faire évoluer et réordonnez vos cartes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addNeedCard}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #0B2545",
                    background: "#F8FAFC",
                    color: "#0B2545",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter un besoin
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {studio.besoins.map((card, index) => {
                  const meta = INTENSITY_META[card.intensite];
                  return (
                    <div
                      key={card.id}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        border: "1px solid #D1D5DB",
                        background: "#FAFAF9",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#4B5563",
                            }}
                          >
                            Besoin #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateNeedCard(card.id, { intensite: meta.next })
                            }
                            title="Cliquer pour changer l'intensité (Critique → Majeur → Modéré)"
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                            }}
                          >
                            Intensité : {meta.label} ↻
                          </button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => moveNeedCard(index, -1)}
                            aria-label={`Monter le besoin ${index + 1}`}
                            style={{
                              padding: "4px 8px",
                              fontSize: 12,
                              borderRadius: 6,
                              border: "1px solid #D1D5DB",
                              background: "#FFFFFF",
                              cursor: "pointer",
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveNeedCard(index, 1)}
                            aria-label={`Descendre le besoin ${index + 1}`}
                            style={{
                              padding: "4px 8px",
                              fontSize: 12,
                              borderRadius: 6,
                              border: "1px solid #D1D5DB",
                              background: "#FFFFFF",
                              cursor: "pointer",
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeNeedCard(card.id)}
                            aria-label={`Supprimer le besoin ${index + 1}`}
                            style={{
                              padding: "4px 8px",
                              fontSize: 12,
                              borderRadius: 6,
                              border: "1px solid #FCA5A5",
                              background: "#FEF2F2",
                              color: "#B91C1C",
                              cursor: "pointer",
                            }}
                          >
                            Supprimer
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
                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                            Besoin non satisfait / Problème vécu
                          </span>
                          <input
                            type="text"
                            value={card.besoin}
                            onChange={(e) =>
                              updateNeedCard(card.id, { besoin: e.target.value })
                            }
                            placeholder="Ex: Délai de 3 semaines pour trouver un rendez-vous..."
                            className="eic-form-input"
                          />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                            Partie prenante concernée
                          </span>
                          <input
                            type="text"
                            value={card.partiePrenante}
                            onChange={(e) =>
                              updateNeedCard(card.id, {
                                partiePrenante: e.target.value,
                              })
                            }
                            placeholder="Ex: Utilisateur final, parent, praticien, administration..."
                            className="eic-form-input"
                          />
                        </label>

                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                            Fréquence &amp; coût de l&apos;irritant
                          </span>
                          <input
                            type="text"
                            value={card.frequence}
                            onChange={(e) =>
                              updateNeedCard(card.id, { frequence: e.target.value })
                            }
                            placeholder="Ex: Chaque semaine / perte de 2h par démarche"
                            className="eic-form-input"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 3: Alternatives Actuelles & Limites */}
            <section
              style={{
                padding: 20,
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 14,
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
                  <h3 style={{ margin: 0, fontSize: 16, color: "#0B2545" }}>
                    3. Alternatives Actuelles &amp; Limites
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                    Comment vos clients se débrouillent-ils aujourd&apos;hui (système D, concurrents, papier/WhatsApp) et pourquoi cela échoue ?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAlternativeRow}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #0B2545",
                    background: "#F8FAFC",
                    color: "#0B2545",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter une alternative
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {studio.alternatives.map((row, idx) => (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: 10,
                      alignItems: "end",
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid #E5E7EB",
                      background: "#F9FAFB",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        Alternative actuelle #{idx + 1} (comment ils font aujourd&apos;hui)
                      </span>
                      <input
                        type="text"
                        value={row.alternative}
                        onChange={(e) =>
                          updateAlternativeRow(row.id, {
                            alternative: e.target.value,
                          })
                        }
                        placeholder="Ex: Groupes Facebook / Bouche-à-oreille / Excel manuel"
                        className="eic-form-input"
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        Pourquoi c&apos;est insuffisant (limite majeure)
                      </span>
                      <input
                        type="text"
                        value={row.pourquoiInsuffisant}
                        onChange={(e) =>
                          updateAlternativeRow(row.id, {
                            pourquoiInsuffisant: e.target.value,
                          })
                        }
                        placeholder="Ex: Aucune garantie de fiabilité, perte d'informations, très lent"
                        className="eic-form-input"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeAlternativeRow(row.id)}
                      aria-label={`Supprimer l'alternative ${idx + 1}`}
                      style={{
                        padding: "8px 10px",
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #FCA5A5",
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4: Matrice d'Hypothèses Prioritaires & Guide d'Entretien B2C (2-Column Interactive Board) */}
            <section
              style={{
                padding: 20,
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: "#0B2545" }}>
                  4. Matrice d&apos;Hypothèses Prioritaires &amp; Guide d&apos;Entretien B2C
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                  Classez vos hypothèses entre les deux colonnes et déplacez une carte d&apos;une colonne à l&apos;autre en 1 clic selon vos apprentissages terrain.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {/* Column 1: Critical Hypotheses */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "#FFFBEB",
                    border: "1px solid #FCD34D",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: 14, color: "#92400E" }}>
                      🔥 Hypothèses Critiques (à tester en priorité)
                    </h4>
                    <button
                      type="button"
                      onClick={() => addHypothesisCard("critique")}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #D97706",
                        background: "#FFFFFF",
                        color: "#92400E",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      + Critique
                    </button>
                  </div>

                  {criticalHypotheses.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: "#92400E" }}>
                      Aucune hypothèse critique. Ajoutez-en une ou basculez une hypothèse secondaire ici.
                    </p>
                  ) : null}

                  {criticalHypotheses.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: "#FFFFFF",
                        border: "1px solid #FDE68A",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleHypothesisPriority(h.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #93C5FD",
                            background: "#EFF6FF",
                            color: "#1E40AF",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Déplacer vers 🧪 Secondaires →
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHypothesisCard(h.id)}
                          style={{
                            padding: "3px 7px",
                            borderRadius: 6,
                            border: "1px solid #FCA5A5",
                            background: "#FEF2F2",
                            color: "#B91C1C",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Supprimer
                        </button>
                      </div>

                      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                          Hypothèse à vérifier
                        </span>
                        <input
                          type="text"
                          value={h.hypothese}
                          onChange={(e) =>
                            updateHypothesisCard(h.id, { hypothese: e.target.value })
                          }
                          placeholder="Ex: Les étudiants acceptent de réserver 24h à l'avance..."
                          className="eic-form-input"
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                          Question d&apos;entretien B2C (ouverte, non biaisée)
                        </span>
                        <input
                          type="text"
                          value={h.questionEntretien}
                          onChange={(e) =>
                            updateHypothesisCard(h.id, {
                              questionEntretien: e.target.value,
                            })
                          }
                          placeholder="Ex: Racontez-moi la dernière fois où vous avez cherché..."
                          className="eic-form-input"
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                          Critère de validation terrain
                        </span>
                        <input
                          type="text"
                          value={h.critereValidation}
                          onChange={(e) =>
                            updateHypothesisCard(h.id, {
                              critereValidation: e.target.value,
                            })
                          }
                          placeholder="Ex: Au moins 4 interviewés sur 5 citent ce frein spontanément"
                          className="eic-form-input"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                {/* Column 2: Secondary Hypotheses */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: 14, color: "#075985" }}>
                      🧪 Hypothèses Secondaires
                    </h4>
                    <button
                      type="button"
                      onClick={() => addHypothesisCard("secondaire")}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #0284C7",
                        background: "#FFFFFF",
                        color: "#075985",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      + Secondaire
                    </button>
                  </div>

                  {secondaryHypotheses.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: "#075985" }}>
                      Aucune hypothèse secondaire. Ajoutez-en une ou déplacez une carte depuis la colonne critique.
                    </p>
                  ) : null}

                  {secondaryHypotheses.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: "#FFFFFF",
                        border: "1px solid #BAE6FD",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleHypothesisPriority(h.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #FCD34D",
                            background: "#FFFBEB",
                            color: "#92400E",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ← Promouvoir en 🔥 Critique
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHypothesisCard(h.id)}
                          style={{
                            padding: "3px 7px",
                            borderRadius: 6,
                            border: "1px solid #FCA5A5",
                            background: "#FEF2F2",
                            color: "#B91C1C",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Supprimer
                        </button>
                      </div>

                      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                          Hypothèse à vérifier
                        </span>
                        <input
                          type="text"
                          value={h.hypothese}
                          onChange={(e) =>
                            updateHypothesisCard(h.id, { hypothese: e.target.value })
                          }
                          placeholder="Ex: Un rappel SMS réduit les oublis de rendez-vous..."
                          className="eic-form-input"
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                          Question d&apos;entretien B2C
                        </span>
                        <input
                          type="text"
                          value={h.questionEntretien}
                          onChange={(e) =>
                            updateHypothesisCard(h.id, {
                              questionEntretien: e.target.value,
                            })
                          }
                          placeholder="Ex: Quels outils utilisez-vous pour ne pas oublier..."
                          className="eic-form-input"
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
                          Critère de validation terrain
                        </span>
                        <input
                          type="text"
                          value={h.critereValidation}
                          onChange={(e) =>
                            updateHypothesisCard(h.id, {
                              critereValidation: e.target.value,
                            })
                          }
                          placeholder="Ex: 3 utilisateurs sur 5 préfèrent WhatsApp à l'email"
                          className="eic-form-input"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 5: Synthèse du Besoin Identifié & Solution Proposée */}
            <section
              style={{
                padding: 20,
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: "#0B2545" }}>
                  5. Synthèse du Besoin Identifié &amp; Solution Proposée
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
                  Formulez en quelques phrases claires le besoin racine identifié et la réponse concrète que votre projet apporte.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    Synthèse du besoin identifié (Problem Statement)
                  </span>
                  <textarea
                    rows={3}
                    value={studio.syntheseBesoin}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        syntheseBesoin: e.target.value,
                      }))
                    }
                    placeholder="Ex: Les jeunes patients perdent un temps précieux faute d'orientation fiable dès les premiers symptômes..."
                    className="eic-form-textarea"
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    Solution proposée (Proposition de valeur initiale)
                  </span>
                  <textarea
                    rows={3}
                    value={studio.solutionProposee}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        solutionProposee: e.target.value,
                      }))
                    }
                    placeholder="Ex: Une plateforme mobile d'orientation rapide connectée aux structures partenaires..."
                    className="eic-form-textarea"
                  />
                </label>
              </div>
            </section>

            {/* Markdown Preview Toggle + Submit Bar */}
            <div
              style={{
                padding: 16,
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
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
                  type="button"
                  onClick={() => setShowMarkdownPreview((v) => !v)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    background: "#FFFFFF",
                    color: "#374151",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {showMarkdownPreview
                    ? "Masquer l'aperçu du livrable généré"
                    : "Aperçu du livrable structuré (Markdown)"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AutoSaveBadge lastSavedAt={lastSavedAt} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="eic-button--submit"
                  >
                    {pending ? t.submission_submitting : submitLabel}
                  </button>
                </div>
              </div>

              {showMarkdownPreview ? (
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 8,
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    color: "#1F2937",
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {serializedMarkdown ||
                    "Remplissez au moins un champ de l'atelier pour générer l'aperçu du livrable."}
                </pre>
              ) : null}

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
