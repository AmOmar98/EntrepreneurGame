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

type InterviewQuestionItem = {
  id: string;
  question: string;
  objectifEcoute: string;
};

type IdeationCategory = "classique" | "rupture" | "contre_intuitive";

type IdeationCardItem = {
  id: string;
  idee: string;
  categorie: IdeationCategory;
  retenue: boolean;
};

type DesignThinkingStudioState = {
  // Stage 1 — EMPATHIZE
  empathySays: string;
  empathyThinks: string;
  empathyDoes: string;
  empathyFeels: string;
  interviewQuestions: InterviewQuestionItem[];
  // Stage 2 — DEFINE
  utilisateurCible: string;
  besoinProfond: string;
  insightTerrain: string;
  commentPourrionsNous: string;
  // Stage 3 — IDEATE
  ideationCards: IdeationCardItem[];
  // Stage 4 — PROTOTYPE & TEST
  formatPrototype: string;
  hypotheseCritiqueTestee: string;
  signalValidationAttendu: string;
};

const initialWorkflowState: WorkflowState = { ok: false, message: "" };

const DEFAULT_STUDIO_STATE: DesignThinkingStudioState = {
  empathySays: "",
  empathyThinks: "",
  empathyDoes: "",
  empathyFeels: "",
  interviewQuestions: [
    {
      id: "q-1",
      question: "",
      objectifEcoute: "Comprendre le vécu réel et la dernière occurrence du problème",
    },
    {
      id: "q-2",
      question: "",
      objectifEcoute: "Identifier les solutions de contournement actuelles et leurs limites",
    },
    {
      id: "q-3",
      question: "",
      objectifEcoute: "Mesurer l'impact émotionnel, le temps perdu ou le coût subi",
    },
  ],
  utilisateurCible: "",
  besoinProfond: "",
  insightTerrain: "",
  commentPourrionsNous: "",
  ideationCards: [
    {
      id: "idea-1",
      idee: "",
      categorie: "classique",
      retenue: false,
    },
    {
      id: "idea-2",
      idee: "",
      categorie: "rupture",
      retenue: true,
    },
    {
      id: "idea-3",
      idee: "",
      categorie: "contre_intuitive",
      retenue: false,
    },
  ],
  formatPrototype: "",
  hypotheseCritiqueTestee: "",
  signalValidationAttendu: "",
};

const PROTOTYPE_FORMAT_PRESETS = [
  "Maquette interactive (Figma / Papier)",
  "Landing page de test",
  "Concierge (service manuel simulé)",
  "Jeu de rôle / Mise en situation",
  "Storyboard illustré",
  "Démonstrateur fonctionnel rapide",
] as const;

const QUESTION_STARTERS = [
  "Racontez-moi la dernière fois où vous avez été confronté à...",
  "Comment procédez-vous aujourd'hui lorsque vous devez...",
  "Qu'est-ce qui a été le plus difficile ou frustrant quand...",
  "Qu'avez-vous déjà essayé pour résoudre cela et que s'est-il passé ?",
] as const;

const IDEATION_CATEGORY_META: Record<
  IdeationCategory,
  {
    label: string;
    badgeBg: string;
    badgeColor: string;
    cardBg: string;
    cardBorder: string;
    description: string;
  }
> = {
  classique: {
    label: "💡 Classique",
    badgeBg: "#FEF3C7",
    badgeColor: "#92400E",
    cardBg: "#FFFBEB",
    cardBorder: "#FDE68A",
    description: "Réponse directe et attendue au besoin",
  },
  rupture: {
    label: "🚀 Rupture",
    badgeBg: "#E0F2FE",
    badgeColor: "#075985",
    cardBg: "#F0F9FF",
    cardBorder: "#BAE6FD",
    description: "Approche innovante qui change les règles habituelles",
  },
  contre_intuitive: {
    label: "⚡ Contre-intuitive / audacieuse",
    badgeBg: "#F3E8FF",
    badgeColor: "#6B21A8",
    cardBg: "#FAF5FF",
    cardBorder: "#E9D5FF",
    description: "Idée provocante ou inversée qui bouscule les évidences",
  },
};

/**
 * Pedagogical warn-only check (R2): detects closed (yes/no) or leading future-hypothetical
 * questions so the team can rephrase them into open-ended discovery questions.
 */
function detectLeadingOrClosedQuestion(raw: string): string | null {
  const q = raw.trim().toLowerCase();
  if (q.length < 6) return null;

  if (
    /^(est-ce que|est ce que|pensez-vous|pensez vous|croyez-vous|trouvez-vous|n'est-ce pas|ne pensez-vous pas)\b/.test(
      q,
    )
  ) {
    return "Astuce terrain : cette formulation ressemble à une question fermée (oui/non) ou orientée. Préférez « Racontez-moi la dernière fois où… » ou « Comment faites-vous pour… ».";
  }

  if (
    /\b(aimeriez-vous|utiliseriez-vous|achèteriez-vous|acheteriez-vous|seriez-vous prêt|seriez vous pret|paieriez-vous)\b/.test(
      q,
    )
  ) {
    return "Astuce « Mom Test » : évitez les questions hypothétiques au conditionnel (« Utiliseriez-vous… ? »). Interrogez plutôt sur les comportements passés réels.";
  }

  return null;
}

function serializeStudioToMarkdown(
  studio: DesignThinkingStudioState,
  deliverableTitle: string,
): string {
  const lines: string[] = [];
  lines.push(`# ${deliverableTitle || "Trame d'entretiens clients & Design Thinking"}`);
  lines.push("");

  // Stage 1
  lines.push("## 1. EMPATHIZE — Carte d'Empathie & Guide d'Entretien Terrain");
  lines.push("");
  lines.push("### Carte d'Empathie (4 quadrants)");
  lines.push(
    `- **Ce qu'il dit (Verbatims & expressions) :** ${studio.empathySays.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Ce qu'il pense (Croyances & préoccupations) :** ${studio.empathyThinks.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Ce qu'il fait (Comportements & contournements) :** ${studio.empathyDoes.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Ce qu'il ressent (Émotions & frustrations) :** ${studio.empathyFeels.trim() || "_Non renseigné_"}`,
  );
  lines.push("");

  lines.push("### Guide d'entretien terrain (Questions ouvertes)");
  const filledQuestions = studio.interviewQuestions.filter(
    (item) => item.question.trim().length > 0 || item.objectifEcoute.trim().length > 0,
  );
  if (filledQuestions.length === 0) {
    lines.push("- _Aucune question d'entretien renseignée_");
  } else {
    filledQuestions.forEach((item, idx) => {
      const qText = item.question.trim() || "_Question à formuler_";
      const objText = item.objectifEcoute.trim();
      lines.push(
        `${idx + 1}. **${qText}**${objText ? `  \n   _Objectif d'écoute :_ ${objText}` : ""}`,
      );
    });
  }
  lines.push("");

  // Stage 2
  lines.push("## 2. DEFINE — Point de Vue (POV) & « Comment pourrions-nous… »");
  lines.push("");
  const target = studio.utilisateurCible.trim() || "[Utilisateur cible]";
  const need = studio.besoinProfond.trim() || "[besoin profond]";
  const insight = studio.insightTerrain.trim() || "[insight terrain surprenant]";
  lines.push(`### Formulation du Point de Vue (POV)`);
  lines.push(`> **${target}** a besoin de **${need}** parce que **${insight}**.`);
  lines.push("");
  lines.push(`- **Utilisateur cible :** ${studio.utilisateurCible.trim() || "_Non renseigné_"}`);
  lines.push(`- **Besoin profond :** ${studio.besoinProfond.trim() || "_Non renseigné_"}`);
  lines.push(
    `- **Insight terrain surprenant :** ${studio.insightTerrain.trim() || "_Non renseigné_"}`,
  );
  lines.push("");
  lines.push("### Question Défi — « Comment pourrions-nous (How Might We)… »");
  lines.push(
    studio.commentPourrionsNous.trim()
      ? `> **Comment pourrions-nous** ${studio.commentPourrionsNous.trim().replace(/^comment pourrions[- ]nous\s*/i, "")}`
      : "_Non renseigné_",
  );
  lines.push("");

  // Stage 3
  lines.push("## 3. IDEATE — Mur d'Idéation & Idée Contre-Intuitive");
  lines.push("");
  const filledIdeas = studio.ideationCards.filter((c) => c.idee.trim().length > 0);
  if (filledIdeas.length === 0) {
    lines.push("- _Aucune idée renseignée sur le mur d'idéation_");
  } else {
    filledIdeas.forEach((card, idx) => {
      const catLabel = IDEATION_CATEGORY_META[card.categorie]?.label ?? card.categorie;
      const retainedBadge = card.retenue ? " ✅ **[Idée retenue pour le prototype]**" : "";
      lines.push(`${idx + 1}. **[${catLabel}]** ${card.idee.trim()}${retainedBadge}`);
    });
  }
  lines.push("");

  // Stage 4
  lines.push("## 4. PROTOTYPE & TEST — Protocole d'Expérimentation Rapide");
  lines.push("");
  lines.push(
    `- **Format du prototype :** ${studio.formatPrototype.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Hypothèse critique testée :** ${studio.hypotheseCritiqueTestee.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Signal de validation attendu :** ${studio.signalValidationAttendu.trim() || "_Non renseigné_"}`,
  );

  return lines.join("\n").slice(0, 15500);
}

export function DesignThinkingComposer({
  deliverableTemplateId,
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
  const [studio, setStudio] = useState<DesignThinkingStudioState>(DEFAULT_STUDIO_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [state, formAction, pending] = useActionState(submitDeliverable, initialWorkflowState);

  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  const storageKey = useMemo(
    () => `${buildDraftStorageKey({ playerId, deliverableTemplateId, version })}_studio`,
    [playerId, deliverableTemplateId, version],
  );

  // Hydrate studio state from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DesignThinkingStudioState>;
        setStudio((prev) => ({
          empathySays:
            typeof parsed.empathySays === "string" ? parsed.empathySays : prev.empathySays,
          empathyThinks:
            typeof parsed.empathyThinks === "string" ? parsed.empathyThinks : prev.empathyThinks,
          empathyDoes:
            typeof parsed.empathyDoes === "string" ? parsed.empathyDoes : prev.empathyDoes,
          empathyFeels:
            typeof parsed.empathyFeels === "string" ? parsed.empathyFeels : prev.empathyFeels,
          interviewQuestions:
            Array.isArray(parsed.interviewQuestions) && parsed.interviewQuestions.length > 0
              ? parsed.interviewQuestions.map((q, idx) => ({
                  id: typeof q?.id === "string" ? q.id : `q-${idx + 1}`,
                  question: typeof q?.question === "string" ? q.question : "",
                  objectifEcoute: typeof q?.objectifEcoute === "string" ? q.objectifEcoute : "",
                }))
              : prev.interviewQuestions,
          utilisateurCible:
            typeof parsed.utilisateurCible === "string"
              ? parsed.utilisateurCible
              : prev.utilisateurCible,
          besoinProfond:
            typeof parsed.besoinProfond === "string" ? parsed.besoinProfond : prev.besoinProfond,
          insightTerrain:
            typeof parsed.insightTerrain === "string"
              ? parsed.insightTerrain
              : prev.insightTerrain,
          commentPourrionsNous:
            typeof parsed.commentPourrionsNous === "string"
              ? parsed.commentPourrionsNous
              : prev.commentPourrionsNous,
          ideationCards:
            Array.isArray(parsed.ideationCards) && parsed.ideationCards.length > 0
              ? parsed.ideationCards.map((c, idx) => ({
                  id: typeof c?.id === "string" ? c.id : `idea-${idx + 1}`,
                  idee: typeof c?.idee === "string" ? c.idee : "",
                  categorie:
                    c?.categorie === "classique" ||
                    c?.categorie === "rupture" ||
                    c?.categorie === "contre_intuitive"
                      ? c.categorie
                      : "classique",
                  retenue: Boolean(c?.retenue),
                }))
              : prev.ideationCards,
          formatPrototype:
            typeof parsed.formatPrototype === "string"
              ? parsed.formatPrototype
              : prev.formatPrototype,
          hypotheseCritiqueTestee:
            typeof parsed.hypotheseCritiqueTestee === "string"
              ? parsed.hypotheseCritiqueTestee
              : prev.hypotheseCritiqueTestee,
          signalValidationAttendu:
            typeof parsed.signalValidationAttendu === "string"
              ? parsed.signalValidationAttendu
              : prev.signalValidationAttendu,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore storage read errors in private browsing
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Persist studio state to localStorage on every change once hydrated.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Ignore quota / privacy errors
    }
  }, [studio, hydrated, storageKey]);

  // Handle successful submission.
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
          // noop
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, storageKey, router]);

  // Stage completion checks (warn-only R2 indicators)
  const stage1Complete = useMemo(() => {
    const quadrantsFilled =
      [
        studio.empathySays,
        studio.empathyThinks,
        studio.empathyDoes,
        studio.empathyFeels,
      ].filter((v) => v.trim().length > 0).length >= 2;
    const questionsFilled = studio.interviewQuestions.some((q) => q.question.trim().length > 0);
    return quadrantsFilled && questionsFilled;
  }, [
    studio.empathySays,
    studio.empathyThinks,
    studio.empathyDoes,
    studio.empathyFeels,
    studio.interviewQuestions,
  ]);

  const stage2Complete = useMemo(() => {
    return (
      studio.utilisateurCible.trim().length > 0 &&
      studio.besoinProfond.trim().length > 0 &&
      studio.insightTerrain.trim().length > 0 &&
      studio.commentPourrionsNous.trim().length > 0
    );
  }, [
    studio.utilisateurCible,
    studio.besoinProfond,
    studio.insightTerrain,
    studio.commentPourrionsNous,
  ]);

  const stage3Complete = useMemo(() => {
    const hasIdea = studio.ideationCards.some((c) => c.idee.trim().length > 0);
    const hasRetained = studio.ideationCards.some(
      (c) => c.retenue && c.idee.trim().length > 0,
    );
    return hasIdea && hasRetained;
  }, [studio.ideationCards]);

  const hasCounterIntuitiveIdea = useMemo(() => {
    return studio.ideationCards.some(
      (c) => c.categorie === "contre_intuitive" && c.idee.trim().length > 0,
    );
  }, [studio.ideationCards]);

  const stage4Complete = useMemo(() => {
    return (
      studio.formatPrototype.trim().length > 0 &&
      studio.hypotheseCritiqueTestee.trim().length > 0 &&
      studio.signalValidationAttendu.trim().length > 0
    );
  }, [
    studio.formatPrototype,
    studio.hypotheseCritiqueTestee,
    studio.signalValidationAttendu,
  ]);

  const completedStagesCount = [
    stage1Complete,
    stage2Complete,
    stage3Complete,
    stage4Complete,
  ].filter(Boolean).length;

  const serializedMarkdown = useMemo(
    () => serializeStudioToMarkdown(studio, deliverableTitle),
    [studio, deliverableTitle],
  );

  const submitLabel = version === 2 ? t.submission_v2_submit : t.submission_submit;

  // Handlers for interview questions
  const updateQuestion = (
    id: string,
    field: "question" | "objectifEcoute",
    value: string,
  ) => {
    setStudio((prev) => ({
      ...prev,
      interviewQuestions: prev.interviewQuestions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q,
      ),
    }));
  };

  const addQuestion = (starterText = "") => {
    setStudio((prev) => ({
      ...prev,
      interviewQuestions: [
        ...prev.interviewQuestions,
        {
          id: `q-${Date.now()}-${prev.interviewQuestions.length + 1}`,
          question: starterText,
          objectifEcoute: "",
        },
      ],
    }));
  };

  const removeQuestion = (id: string) => {
    setStudio((prev) => ({
      ...prev,
      interviewQuestions:
        prev.interviewQuestions.length > 1
          ? prev.interviewQuestions.filter((q) => q.id !== id)
          : prev.interviewQuestions,
    }));
  };

  // Handlers for ideation post-its
  const updateIdeaCard = (id: string, patch: Partial<IdeationCardItem>) => {
    setStudio((prev) => ({
      ...prev,
      ideationCards: prev.ideationCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const addIdeaCard = (categorie: IdeationCategory = "classique") => {
    setStudio((prev) => ({
      ...prev,
      ideationCards: [
        ...prev.ideationCards,
        {
          id: `idea-${Date.now()}-${prev.ideationCards.length + 1}`,
          idee: "",
          categorie,
          retenue: false,
        },
      ],
    }));
  };

  const removeIdeaCard = (id: string) => {
    setStudio((prev) => ({
      ...prev,
      ideationCards:
        prev.ideationCards.length > 1
          ? prev.ideationCards.filter((c) => c.id !== id)
          : prev.ideationCards,
    }));
  };

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
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#0B2545",
            }}
          >
            Studio Design Thinking & Entretiens
          </span>
          <span style={{ fontSize: 13, color: "#6B7280" }}>
            Construisez votre carte d&apos;empathie, votre POV et votre protocole de test directement dans l&apos;application.
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Mode de saisie du livrable"
          style={{
            display: "inline-flex",
            background: "#F3F4F6",
            padding: 4,
            borderRadius: 10,
            gap: 4,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "studio"}
            onClick={() => setMode("studio")}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
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
            aria-selected={mode === "external"}
            onClick={() => setMode("external")}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: mode === "external" ? "#0B2545" : "transparent",
              color: mode === "external" ? "#FFFFFF" : "#374151",
              transition: "all 0.15s ease",
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
        <>
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

            {/* 4-Stage Progress & Pedagogical Status Bar (R2 warn-only) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 16,
                background: "#FAFAF7",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
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
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      background: completedStagesCount === 4 ? "#DCFCE7" : "#FEF3C7",
                      color: completedStagesCount === 4 ? "#166534" : "#92400E",
                    }}
                  >
                    {completedStagesCount} / 4 étapes Design Thinking complétées
                  </span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    Indication pédagogique (la soumission reste ouverte à tout moment)
                  </span>
                </div>
                <AutoSaveBadge lastSavedAt={lastSavedAt} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  {
                    num: "1",
                    title: "EMPATHIZE",
                    sub: "Carte d'empathie & Entretiens",
                    done: stage1Complete,
                  },
                  {
                    num: "2",
                    title: "DEFINE",
                    sub: "Point de Vue & HMW",
                    done: stage2Complete,
                  },
                  {
                    num: "3",
                    title: "IDEATE",
                    sub: "Mur d'idées & Contre-intuition",
                    done: stage3Complete,
                  },
                  {
                    num: "4",
                    title: "PROTOTYPE & TEST",
                    sub: "Expérimentation rapide",
                    done: stage4Complete,
                  },
                ].map((st) => (
                  <div
                    key={st.num}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${st.done ? "#86EFAC" : "#E5E7EB"}`,
                      background: st.done ? "#F0FDF4" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        background: st.done ? "#16A34A" : "#E5E7EB",
                        color: st.done ? "#FFFFFF" : "#374151",
                        flexShrink: 0,
                      }}
                    >
                      {st.done ? "✓" : st.num}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#111827",
                        }}
                      >
                        {st.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {st.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================================================================
                STAGE 1 — EMPATHIZE (Carte d'Empathie & Guide d'entretien terrain)
               ================================================================ */}
            <section
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <header
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#215D8F",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Étape 1 · Empathize
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 2 }}>
                    Carte d&apos;Empathie &amp; Guide d&apos;entretien terrain
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: stage1Complete ? "#DCFCE7" : "#FEF3C7",
                    color: stage1Complete ? "#166534" : "#92400E",
                  }}
                >
                  {stage1Complete ? "✓ Étape renseignée" : "À compléter (au moins 2 quadrants + 1 question)"}
                </span>
              </header>

              {/* 4-Quadrant Empathy Map */}
              <div>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 14, color: "#111827" }}>
                    1A. Carte d&apos;Empathie (4 quadrants)
                  </strong>
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                    Mettez-vous dans la peau de votre utilisateur cible lors de ses entretiens ou observations terrain.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 14,
                  }}
                >
                  {/* Quadrant 1: Ce qu'il dit */}
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 14,
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                      💬 Ce qu&apos;il dit
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      Citations directes, expressions récurrentes, objections verbalisées.
                    </span>
                    <textarea
                      rows={3}
                      value={studio.empathySays}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, empathySays: e.target.value }))
                      }
                      placeholder='Ex : « Je perds au moins 2 heures chaque semaine à relancer mes fournisseurs sur WhatsApp… »'
                      className="eic-form-textarea"
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        fontSize: 13,
                      }}
                    />
                  </label>

                  {/* Quadrant 2: Ce qu'il pense */}
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 14,
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                      💭 Ce qu&apos;il pense
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      Ce qu&apos;il garde pour lui, ses doutes, ses croyances ou craintes non dites.
                    </span>
                    <textarea
                      rows={3}
                      value={studio.empathyThinks}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, empathyThinks: e.target.value }))
                      }
                      placeholder="Ex : Il craint qu'un logiciel complexe lui fasse perdre le contrôle devant ses clients…"
                      className="eic-form-textarea"
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        fontSize: 13,
                      }}
                    />
                  </label>

                  {/* Quadrant 3: Ce qu'il fait */}
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 14,
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                      🛠️ Ce qu&apos;il fait
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      Actions observables, bricolages actuels (Excel, carnet papier, appels…).
                    </span>
                    <textarea
                      rows={3}
                      value={studio.empathyDoes}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, empathyDoes: e.target.value }))
                      }
                      placeholder="Ex : Inscrit tout sur un carnet papier puis recopie le soir sur un tableur partagé…"
                      className="eic-form-textarea"
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        fontSize: 13,
                      }}
                    />
                  </label>

                  {/* Quadrant 4: Ce qu'il ressent */}
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 14,
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                      ❤️ Ce qu&apos;il ressent
                    </span>
                    <span style={{ fontSize: 12, color: "#64748B" }}>
                      Émotions dominantes : frustration, anxiété, soulagement espéré, fierté.
                    </span>
                    <textarea
                      rows={3}
                      value={studio.empathyFeels}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, empathyFeels: e.target.value }))
                      }
                      placeholder="Ex : Stressé par les oublis de commande, frustré de passer ses soirées sur l'administratif…"
                      className="eic-form-textarea"
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        fontSize: 13,
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Open-Ended Interview Questions Builder */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  paddingTop: 8,
                  borderTop: "1px solid #F3F4F6",
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: "#111827" }}>
                    1B. Guide d&apos;entretien terrain (Questions ouvertes)
                  </strong>
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                    Préparez vos questions d&apos;exploration centrées sur le vécu réel du client (sans pitcher votre solution).
                  </p>
                </div>

                {/* Pedagogical Tip Banner (Warn-only R2) */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    color: "#92400E",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  <strong>💡 Conseil pédagogique (Règle d&apos;or de l&apos;entretien) :</strong>{" "}
                  Bannissez les questions fermées (oui/non) ou orientées comme{" "}
                  <em>« Est-ce que vous aimeriez une application qui… ? »</em>. Posez des questions ouvertes sur le passé :{" "}
                  <em>« Racontez-moi la dernière fois où… »</em>, <em>« Comment faites-vous aujourd&apos;hui pour… ? »</em>.
                </div>

                {/* Quick starter chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>
                    Insérer une amorce :
                  </span>
                  {QUESTION_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => addQuestion(starter)}
                      style={{
                        border: "1px solid #D1D5DB",
                        background: "#F9FAFB",
                        color: "#1F2937",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + « {starter} »
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {studio.interviewQuestions.map((item, idx) => {
                    const warnTip = detectLeadingOrClosedQuestion(item.question);
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: `1px solid ${warnTip ? "#F59E0B" : "#E5E7EB"}`,
                          background: warnTip ? "#FFFBEB" : "#FAFAFA",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#0B2545" }}>
                            Question ouverte #{idx + 1}
                          </span>
                          {studio.interviewQuestions.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeQuestion(item.id)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#B91C1C",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Supprimer
                            </button>
                          ) : null}
                        </div>

                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) =>
                            updateQuestion(item.id, "question", e.target.value)
                          }
                          placeholder="Ex : Racontez-moi la dernière fois où vous avez cherché à..."
                          className="eic-form-input"
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: "1px solid #CBD5E1",
                            background: "#FFFFFF",
                            fontSize: 13,
                          }}
                        />

                        <input
                          type="text"
                          value={item.objectifEcoute}
                          onChange={(e) =>
                            updateQuestion(item.id, "objectifEcoute", e.target.value)
                          }
                          placeholder="Ce que l'on cherche à vérifier / écouter derrière cette question (optionnel)"
                          className="eic-form-input"
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: 6,
                            border: "1px solid #E2E8F0",
                            background: "#FFFFFF",
                            fontSize: 12,
                            color: "#475569",
                          }}
                        />

                        {warnTip ? (
                          <div
                            role="status"
                            style={{
                              fontSize: 12,
                              color: "#B45309",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span>⚠️</span>
                            <span>{warnTip}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => addQuestion("")}
                    style={{
                      border: "1px dashed #94A3B8",
                      background: "#F8FAFC",
                      color: "#0B2545",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Ajouter une question d&apos;entretien
                  </button>
                </div>
              </div>
            </section>

            {/* ================================================================
                STAGE 2 — DEFINE (Formulation du Point de Vue & HMW)
               ================================================================ */}
            <section
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <header
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#215D8F",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Étape 2 · Define
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 2 }}>
                    Formulation du Point de Vue (POV) &amp; « Comment pourrions-nous… »
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: stage2Complete ? "#DCFCE7" : "#FEF3C7",
                    color: stage2Complete ? "#166534" : "#92400E",
                  }}
                >
                  {stage2Complete ? "✓ Étape renseignée" : "À compléter (POV + Comment pourrions-nous)"}
                </span>
              </header>

              {/* POV Mad-Libs Builder */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <strong style={{ fontSize: 14, color: "#111827" }}>
                    2A. Constructeur de Point de Vue (POV Mad-Libs)
                  </strong>
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                    Synthétisez l&apos;enseignement clé de vos entretiens dans la formule canonique du Design Thinking :
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#0B2545" }}>
                      [Utilisateur cible précis]
                    </span>
                    <input
                      type="text"
                      value={studio.utilisateurCible}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, utilisateurCible: e.target.value }))
                      }
                      placeholder="Ex : Un gérant d'épicerie de quartier indépendant"
                      className="eic-form-input"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                      }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#0B2545" }}>
                      a besoin de [besoin profond — verbe d&apos;action]
                    </span>
                    <input
                      type="text"
                      value={studio.besoinProfond}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, besoinProfond: e.target.value }))
                      }
                      placeholder="Ex : réapprovisionner ses rayons critiques en moins de 3 minutes"
                      className="eic-form-input"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                      }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#0B2545" }}>
                      parce que [insight terrain surprenant]
                    </span>
                    <input
                      type="text"
                      value={studio.insightTerrain}
                      onChange={(e) =>
                        setStudio((prev) => ({ ...prev, insightTerrain: e.target.value }))
                      }
                      placeholder="Ex : il négocie seul au comptoir et ne peut jamais quitter sa caisse"
                      className="eic-form-input"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                      }}
                    />
                  </label>
                </div>

                {/* Live POV Statement Preview Card */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    color: "#0C4A6E",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#0284C7",
                      marginBottom: 4,
                    }}
                  >
                    Aperçu de votre phrase Point de Vue (POV) :
                  </span>
                  «{" "}
                  <strong>
                    {studio.utilisateurCible.trim() || "[Utilisateur cible]"}
                  </strong>{" "}
                  a besoin de{" "}
                  <strong>{studio.besoinProfond.trim() || "[besoin profond]"}</strong>{" "}
                  parce que{" "}
                  <strong>
                    {studio.insightTerrain.trim() || "[insight terrain surprenant]"}
                  </strong>
                  . »
                </div>
              </div>

              {/* How Might We (Comment pourrions-nous...) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingTop: 10,
                  borderTop: "1px solid #F3F4F6",
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                    2B. Défi d&apos;idéation : « Comment pourrions-nous (How Might We)… »
                  </span>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    Transformez votre Point de Vue en une question ouverte tremplin qui appelle plusieurs pistes de solutions.
                  </span>
                  <textarea
                    rows={2}
                    value={studio.commentPourrionsNous}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        commentPourrionsNous: e.target.value,
                      }))
                    }
                    placeholder="Ex : Comment pourrions-nous déclencher le réassort des produits critiques sans que l'épicier ait besoin de quitter son comptoir ni de saisir un tableau ?"
                    className="eic-form-textarea"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  />
                </label>
              </div>
            </section>

            {/* ================================================================
                STAGE 3 — IDEATE (Mur d'Idéation & Idée Contre-Intuitive)
               ================================================================ */}
            <section
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <header
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#215D8F",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Étape 3 · Ideate
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 2 }}>
                    Mur d&apos;Idéation &amp; Idée Contre-Intuitive
                  </h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: hasCounterIntuitiveIdea ? "#F3E8FF" : "#FEF3C7",
                      color: hasCounterIntuitiveIdea ? "#6B21A8" : "#92400E",
                    }}
                  >
                    {hasCounterIntuitiveIdea
                      ? "⚡ Idée contre-intuitive présente"
                      : "⚡ Pensez à inclure 1 idée contre-intuitive"}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: stage3Complete ? "#DCFCE7" : "#FEF3C7",
                      color: stage3Complete ? "#166534" : "#92400E",
                    }}
                  >
                    {stage3Complete
                      ? "✓ Idée retenue sélectionnée"
                      : "Cochez au moins 1 « Idée retenue pour le prototype »"}
                  </span>
                </div>
              </header>

              <p style={{ fontSize: 13, color: "#4B5563" }}>
                Explorez plusieurs pistes avant de converger : ajoutez des idées{" "}
                <strong>classiques</strong>, en <strong>rupture</strong> et au moins une{" "}
                <strong>idée contre-intuitive / audacieuse</strong>, puis cochez celle(s) que vous retenez pour le prototypage.
              </p>

              {/* Post-it cards grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                {studio.ideationCards.map((card, index) => {
                  const meta = IDEATION_CATEGORY_META[card.categorie];
                  return (
                    <div
                      key={card.id}
                      style={{
                        background: meta.cardBg,
                        border: `2px solid ${card.retenue ? "#16A34A" : meta.cardBorder}`,
                        borderRadius: 12,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        boxShadow: card.retenue
                          ? "0 4px 12px rgba(22, 163, 74, 0.12)"
                          : "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                          }}
                        >
                          Post-it #{index + 1} · {meta.label}
                        </span>
                        {studio.ideationCards.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeIdeaCard(card.id)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#991B1B",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>

                      {/* Category switcher buttons */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(
                          ["classique", "rupture", "contre_intuitive"] as IdeationCategory[]
                        ).map((cat) => {
                          const active = card.categorie === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => updateIdeaCard(card.id, { categorie: cat })}
                              style={{
                                border: active
                                  ? "1px solid #0B2545"
                                  : "1px solid rgba(0,0,0,0.12)",
                                background: active ? "#0B2545" : "#FFFFFF",
                                color: active ? "#FFFFFF" : "#374151",
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {IDEATION_CATEGORY_META[cat].label}
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        rows={3}
                        value={card.idee}
                        onChange={(e) =>
                          updateIdeaCard(card.id, { idee: e.target.value })
                        }
                        placeholder={
                          card.categorie === "contre_intuitive"
                            ? "Ex : Et si le client ne commandait plus jamais lui-même, mais que le fournisseur gérait le stock à sa place ?"
                            : "Décrivez concrètement cette piste de solution..."
                        }
                        className="eic-form-textarea"
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,0.15)",
                          background: "#FFFFFF",
                          fontSize: 13,
                        }}
                      />

                      {/* Toggle Retenue pour le prototype */}
                      <button
                        type="button"
                        onClick={() =>
                          updateIdeaCard(card.id, { retenue: !card.retenue })
                        }
                        aria-pressed={card.retenue}
                        style={{
                          border: card.retenue
                            ? "1px solid #16A34A"
                            : "1px solid #D1D5DB",
                          background: card.retenue ? "#16A34A" : "#FFFFFF",
                          color: card.retenue ? "#FFFFFF" : "#374151",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <span>{card.retenue ? "✅" : "☆"}</span>
                        <span>
                          {card.retenue
                            ? "Idée retenue pour le prototype"
                            : "Retenir pour le prototype"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add post-it buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => addIdeaCard("classique")}
                  style={{
                    border: "1px dashed #94A3B8",
                    background: "#FFFBEB",
                    color: "#92400E",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter une idée classique
                </button>
                <button
                  type="button"
                  onClick={() => addIdeaCard("rupture")}
                  style={{
                    border: "1px dashed #38BDF8",
                    background: "#F0F9FF",
                    color: "#075985",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter une idée de rupture
                </button>
                <button
                  type="button"
                  onClick={() => addIdeaCard("contre_intuitive")}
                  style={{
                    border: "1px dashed #C084FC",
                    background: "#FAF5FF",
                    color: "#6B21A8",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + ⚡ Ajouter une idée contre-intuitive / audacieuse
                </button>
              </div>
            </section>

            {/* ================================================================
                STAGE 4 — PROTOTYPE & TEST (Protocole d'Expérimentation Rapide)
               ================================================================ */}
            <section
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <header
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#215D8F",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Étape 4 · Prototype &amp; Test
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 2 }}>
                    Protocole d&apos;Expérimentation Rapide
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: stage4Complete ? "#DCFCE7" : "#FEF3C7",
                    color: stage4Complete ? "#166534" : "#92400E",
                  }}
                >
                  {stage4Complete ? "✓ Étape renseignée" : "À compléter (Format + Hypothèse + Signal)"}
                </span>
              </header>

              {/* Format du prototype */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  htmlFor="dt-format-prototype"
                  style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}
                >
                  4A. Format du prototype choisi (le plus rapide pour apprendre)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PROTOTYPE_FORMAT_PRESETS.map((preset) => {
                    const selected = studio.formatPrototype === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setStudio((prev) => ({
                            ...prev,
                            formatPrototype: preset,
                          }))
                        }
                        style={{
                          border: selected
                            ? "1px solid #0B2545"
                            : "1px solid #D1D5DB",
                          background: selected ? "#0B2545" : "#F9FAFB",
                          color: selected ? "#FFFFFF" : "#374151",
                          borderRadius: 999,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
                <input
                  id="dt-format-prototype"
                  type="text"
                  value={studio.formatPrototype}
                  onChange={(e) =>
                    setStudio((prev) => ({
                      ...prev,
                      formatPrototype: e.target.value,
                    }))
                  }
                  placeholder="Ex : Maquette interactive 3 écrans sur smartphone + simulation WhatsApp..."
                  className="eic-form-input"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>

              {/* Hypothese critique testee */}
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
                  4B. Hypothèse critique testée par ce prototype
                </span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  Quelle est la croyance n°1 qui, si elle s&apos;avère fausse, remet en cause votre idée retenue ?
                </span>
                <textarea
                  rows={2}
                  value={studio.hypotheseCritiqueTestee}
                  onChange={(e) =>
                    setStudio((prev) => ({
                      ...prev,
                      hypotheseCritiqueTestee: e.target.value,
                    }))
                  }
                  placeholder="Ex : Nous supposons que les épiciers accepteront de partager l'état de leurs stocks quotidiens via une simple photo..."
                  className="eic-form-textarea"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </label>

              {/* Signal de validation attendu */}
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
                  4C. Signal de validation attendu (Critère de succès observable)
                </span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  Quel comportement concret ou seuil mesurable prouvera que l&apos;hypothèse est validée ?
                </span>
                <textarea
                  rows={2}
                  value={studio.signalValidationAttendu}
                  onChange={(e) =>
                    setStudio((prev) => ({
                      ...prev,
                      signalValidationAttendu: e.target.value,
                    }))
                  }
                  placeholder="Ex : Au moins 4 commerçants sur 5 testés comprennent le flux en moins de 30 secondes et acceptent de faire un premier test réel dès demain."
                  className="eic-form-textarea"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </label>
            </section>

            {/* Collapsible Markdown Preview */}
            <details
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                Aperçu du rapport structuré transmis au Mentor (Markdown automatique)
              </summary>
              <pre
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#1F2937",
                  maxHeight: 320,
                  overflowY: "auto",
                }}
              >
                {serializedMarkdown}
              </pre>
            </details>

            {/* Submit Bar */}
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
