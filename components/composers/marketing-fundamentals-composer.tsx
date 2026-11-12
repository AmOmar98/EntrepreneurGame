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
const initialState: WorkflowState = { ok: false, message: "" };

export type InteractiveDeliverableComposerProps = {
  deliverableTemplateId: string;
  deliverableSlug: string;
  deliverableTitle: string;
  playerId?: string | null;
  version?: 1 | 2;
  initialProofText?: string | null;
  initialProofUrl?: string | null;
};

export type ContentPlatform =
  | "LinkedIn"
  | "Instagram / TikTok"
  | "WhatsApp / Email"
  | "Site / Landing Page"
  | "Événement Terrain";

export type TargetAudienceChoice = "Audience A" | "Audience B";

export type AudienceDeclinaison = {
  profilAudience: string;
  angleAccroche: string;
  tonCommunication: string;
  objectionPrincipale: string;
  callToAction: string;
};

export type ContentExampleCard = {
  id: string;
  plateforme: ContentPlatform;
  audienceCible: TargetAudienceChoice;
  formatContenu: string;
  texteOuScriptExemple: string;
};

type MarketingStudioState = {
  problemeVecu: string;
  solutionApportee: string;
  beneficeClientMesurable: string;
  messageCentralSynthese: string;
  audienceA: AudienceDeclinaison;
  audienceB: AudienceDeclinaison;
  contentCards: ContentExampleCard[];
};

const PLATFORM_OPTIONS: ContentPlatform[] = [
  "LinkedIn",
  "Instagram / TikTok",
  "WhatsApp / Email",
  "Site / Landing Page",
  "Événement Terrain",
];

const AUDIENCE_CHOICES: TargetAudienceChoice[] = ["Audience A", "Audience B"];

const TONE_SUGGESTIONS: string[] = [
  "Direct, rassurant & orienté quotidien",
  "Professionnel, chiffré & orienté ROI",
  "Inspirant, communautaire & accessible",
  "Institutionnel, fiable & orienté impact",
];

function createEmptyAudience(): AudienceDeclinaison {
  return {
    profilAudience: "",
    angleAccroche: "",
    tonCommunication: "",
    objectionPrincipale: "",
    callToAction: "",
  };
}

function createInitialStudioState(): MarketingStudioState {
  return {
    problemeVecu: "",
    solutionApportee: "",
    beneficeClientMesurable: "",
    messageCentralSynthese: "",
    audienceA: createEmptyAudience(),
    audienceB: createEmptyAudience(),
    contentCards: [
      {
        id: "content-1",
        plateforme: "Instagram / TikTok",
        audienceCible: "Audience A",
        formatContenu: "",
        texteOuScriptExemple: "",
      },
      {
        id: "content-2",
        plateforme: "LinkedIn",
        audienceCible: "Audience B",
        formatContenu: "",
        texteOuScriptExemple: "",
      },
    ],
  };
}

function hasAudienceContent(aud: AudienceDeclinaison): boolean {
  return Boolean(
    aud.profilAudience.trim() ||
      aud.angleAccroche.trim() ||
      aud.tonCommunication.trim() ||
      aud.objectionPrincipale.trim() ||
      aud.callToAction.trim(),
  );
}

function hasCardContent(card: ContentExampleCard): boolean {
  return Boolean(
    card.formatContenu.trim() || card.texteOuScriptExemple.trim(),
  );
}

function serializeMarketingStateToMarkdown(
  deliverableTitle: string,
  studio: MarketingStudioState,
): string {
  const lines: string[] = [];

  const hasSection1 = Boolean(
    studio.problemeVecu.trim() ||
      studio.solutionApportee.trim() ||
      studio.beneficeClientMesurable.trim() ||
      studio.messageCentralSynthese.trim(),
  );
  const hasSection2 =
    hasAudienceContent(studio.audienceA) || hasAudienceContent(studio.audienceB);
  const filledCards = studio.contentCards.filter(hasCardContent);
  const hasSection3 = filledCards.length > 0;

  if (!hasSection1 && !hasSection2 && !hasSection3) {
    return "";
  }

  lines.push(`# ${deliverableTitle}`);
  lines.push("");

  // Section 1: Le Récit & Message Central
  lines.push("## 1. Le Récit & Message Central (Storytelling)");
  lines.push(
    `- **Problème vécu (déclencheur émotionnel / opérationnel)** : ${
      studio.problemeVecu.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Solution apportée** : ${
      studio.solutionApportee.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Bénéfice client mesurable (transformation obtenue)** : ${
      studio.beneficeClientMesurable.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Message central de synthèse (Pitch 1 phrase)** : ${
      studio.messageCentralSynthese.trim() || "_Non renseigné_"
    }`,
  );
  lines.push("");

  // Section 2: Déclinaison pour Deux Audiences Distinctes
  lines.push("## 2. Déclinaison pour Deux Audiences Distinctes");
  lines.push("");
  lines.push("### Audience A (ex: Utilisateur final / Client B2C)");
  lines.push(
    `- **Profil de l'audience** : ${
      studio.audienceA.profilAudience.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Angle d'accroche** : ${
      studio.audienceA.angleAccroche.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Ton de communication** : ${
      studio.audienceA.tonCommunication.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Objection principale à lever** : ${
      studio.audienceA.objectionPrincipale.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Appel à l'action (Call to Action)** : ${
      studio.audienceA.callToAction.trim() || "_Non renseigné_"
    }`,
  );
  lines.push("");

  lines.push("### Audience B (ex: Décideur B2B / Partenaire / Institutionnel)");
  lines.push(
    `- **Profil de l'audience** : ${
      studio.audienceB.profilAudience.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Angle d'accroche** : ${
      studio.audienceB.angleAccroche.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Ton de communication** : ${
      studio.audienceB.tonCommunication.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Objection principale à lever** : ${
      studio.audienceB.objectionPrincipale.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Appel à l'action (Call to Action)** : ${
      studio.audienceB.callToAction.trim() || "_Non renseigné_"
    }`,
  );
  lines.push("");

  // Section 3: Studio d'Exemples de Contenus & Plateformes
  lines.push("## 3. Exemples de Contenus & Plateformes");
  if (filledCards.length === 0) {
    lines.push("_Aucun exemple de contenu renseigné._");
  } else {
    filledCards.forEach((card, index) => {
      lines.push(
        `### Exemple ${index + 1} — ${card.plateforme} (${card.audienceCible})`,
      );
      lines.push(
        `- **Format du contenu** : ${
          card.formatContenu.trim() || "_Non précisé_"
        }`,
      );
      lines.push(
        `- **Texte / Script d'exemple** :\n  ${
          card.texteOuScriptExemple.trim() || "_Non précisé_"
        }`,
      );
      lines.push("");
    });
  }

  return lines.join("\n").trim();
}

export function MarketingFundamentalsComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "external">("studio");
  const [studio, setStudio] = useState<MarketingStudioState>(
    createInitialStudioState,
  );
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [state, formAction, pending] = useActionState(
    submitDeliverable,
    initialState,
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
        const parsed = JSON.parse(raw) as Partial<MarketingStudioState>;
        setStudio((prev) => ({
          problemeVecu:
            typeof parsed.problemeVecu === "string"
              ? parsed.problemeVecu
              : prev.problemeVecu,
          solutionApportee:
            typeof parsed.solutionApportee === "string"
              ? parsed.solutionApportee
              : prev.solutionApportee,
          beneficeClientMesurable:
            typeof parsed.beneficeClientMesurable === "string"
              ? parsed.beneficeClientMesurable
              : prev.beneficeClientMesurable,
          messageCentralSynthese:
            typeof parsed.messageCentralSynthese === "string"
              ? parsed.messageCentralSynthese
              : prev.messageCentralSynthese,
          audienceA: {
            ...prev.audienceA,
            ...(parsed.audienceA ?? {}),
          },
          audienceB: {
            ...prev.audienceB,
            ...(parsed.audienceB ?? {}),
          },
          contentCards:
            Array.isArray(parsed.contentCards) && parsed.contentCards.length > 0
              ? parsed.contentCards.map((c, idx) => ({
                  id:
                    typeof c?.id === "string" && c.id
                      ? c.id
                      : `content-${idx + 1}`,
                  plateforme: PLATFORM_OPTIONS.includes(
                    c?.plateforme as ContentPlatform,
                  )
                    ? (c.plateforme as ContentPlatform)
                    : "LinkedIn",
                  audienceCible: AUDIENCE_CHOICES.includes(
                    c?.audienceCible as TargetAudienceChoice,
                  )
                    ? (c.audienceCible as TargetAudienceChoice)
                    : "Audience A",
                  formatContenu:
                    typeof c?.formatContenu === "string" ? c.formatContenu : "",
                  texteOuScriptExemple:
                    typeof c?.texteOuScriptExemple === "string"
                      ? c.texteOuScriptExemple
                      : "",
                }))
              : prev.contentCards,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore corrupted JSON or private browsing error
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Persist studio state to localStorage on change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage quota or private mode issues
    }
  }, [studio, hydrated, storageKey]);

  // Handle post-submit cleanup & analytics
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
          // Ignore storage error
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, storageKey, router]);

  const serializedMarkdown = useMemo(
    () => serializeMarketingStateToMarkdown(deliverableTitle, studio),
    [deliverableTitle, studio],
  );

  // R2: Pedagogical progression indicator (warn-only, never blocks submission)
  const section1Done = Boolean(
    studio.problemeVecu.trim() &&
      studio.solutionApportee.trim() &&
      studio.beneficeClientMesurable.trim() &&
      studio.messageCentralSynthese.trim(),
  );
  const section2Done =
    hasAudienceContent(studio.audienceA) &&
    hasAudienceContent(studio.audienceB);
  const filledCardsCount = studio.contentCards.filter(hasCardContent).length;
  const section3Done = filledCardsCount >= 2;

  const completedSectionsCount = [
    section1Done,
    section2Done,
    section3Done,
  ].filter(Boolean).length;

  function updateAudienceField(
    target: "audienceA" | "audienceB",
    field: keyof AudienceDeclinaison,
    value: string,
  ) {
    setStudio((prev) => ({
      ...prev,
      [target]: {
        ...prev[target],
        [field]: value,
      },
    }));
  }

  function updateContentCard(
    id: string,
    patch: Partial<Omit<ContentExampleCard, "id">>,
  ) {
    setStudio((prev) => ({
      ...prev,
      contentCards: prev.contentCards.map((card) =>
        card.id === id ? { ...card, ...patch } : card,
      ),
    }));
  }

  function addContentCard() {
    setStudio((prev) => ({
      ...prev,
      contentCards: [
        ...prev.contentCards,
        {
          id: `content-${Date.now()}-${prev.contentCards.length + 1}`,
          plateforme: "WhatsApp / Email",
          audienceCible:
            prev.contentCards.length % 2 === 0 ? "Audience A" : "Audience B",
          formatContenu: "",
          texteOuScriptExemple: "",
        },
      ],
    }));
  }

  function removeContentCard(id: string) {
    setStudio((prev) => {
      if (prev.contentCards.length <= 1) return prev;
      return {
        ...prev,
        contentCards: prev.contentCards.filter((card) => card.id !== id),
      };
    });
  }

  const submitLabel =
    version === 2 ? t.submission_v2_submit : t.submission_submit;

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
          background: "#f1f5f9",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "studio"}
          onClick={() => setMode("studio")}
          style={{
            flex: "1 1 220px",
            padding: "10px 14px",
            borderRadius: 8,
            border:
              mode === "studio" ? "1px solid #0B2545" : "1px solid transparent",
            background: mode === "studio" ? "#0B2545" : "transparent",
            color: mode === "studio" ? "#ffffff" : "#334155",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ✨ Atelier interactif (recommandé)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "external"}
          onClick={() => setMode("external")}
          style={{
            flex: "1 1 220px",
            padding: "10px 14px",
            borderRadius: 8,
            border:
              mode === "external"
                ? "1px solid #0B2545"
                : "1px solid transparent",
            background: mode === "external" ? "#0B2545" : "transparent",
            color: mode === "external" ? "#ffffff" : "#334155",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          🔗 Lien externe / Texte libre
        </button>
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

            {/* Pedagogical Progress Banner (R2: warn-only, non-blocking) */}
            <div
              role="status"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                background:
                  completedSectionsCount === 3 ? "#f0fdf4" : "#fffbeb",
                border:
                  completedSectionsCount === 3
                    ? "1px solid #86efac"
                    : "1px solid #fde68a",
                color: completedSectionsCount === 3 ? "#166534" : "#92400e",
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 13 }}>
                  Progression de l&apos;atelier : {completedSectionsCount} / 3
                  blocs complétés
                </strong>
                <span style={{ fontSize: 12 }}>
                  {completedSectionsCount === 3
                    ? "Votre récit central, vos 2 audiences et vos exemples de contenus sont prêts à être soumis."
                    : "Repère pédagogique (non bloquant) : complétez le récit en 3 temps, les 2 audiences et au moins 2 exemples de contenus."}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: section1Done ? "#dcfce7" : "#fef3c7",
                    color: section1Done ? "#166534" : "#92400e",
                  }}
                >
                  1. Récit {section1Done ? "✓" : "…"}
                </span>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: section2Done ? "#dcfce7" : "#fef3c7",
                    color: section2Done ? "#166534" : "#92400e",
                  }}
                >
                  2. Audiences A/B {section2Done ? "✓" : "…"}
                </span>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: section3Done ? "#dcfce7" : "#fef3c7",
                    color: section3Done ? "#166534" : "#92400e",
                  }}
                >
                  3. Contenus ({filledCardsCount}/2+) {section3Done ? "✓" : "…"}
                </span>
              </div>
            </div>

            {/* SECTION 1: LE RÉCIT & MESSAGE CENTRAL (STORYTELLING BUILDER) */}
            <section
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#0B2545",
                  }}
                >
                  Étape 1 · Storytelling Builder
                </span>
                <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
                  1. Le Récit &amp; Message Central
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Construisez votre arc narratif en 3 étapes (Problème vécu →
                  Solution apportée → Bénéfice mesurable), puis formulez votre
                  message central en une phrase percutante.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 14,
                }}
              >
                {/* Step 1 Card */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#9f1239",
                    }}
                  >
                    1. Problème vécu (Déclencheur)
                  </span>
                  <span style={{ fontSize: 12, color: "#881337" }}>
                    Quelle frustration émotionnelle ou opérationnelle vit votre
                    cible aujourd&apos;hui ?
                  </span>
                  <textarea
                    rows={3}
                    value={studio.problemeVecu}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        problemeVecu: e.target.value,
                      }))
                    }
                    placeholder="Ex: Les jeunes hésitent à consulter par crainte du jugement et manque d'information fiable..."
                    className="eic-form-textarea"
                    style={{ background: "#ffffff", fontSize: 13 }}
                  />
                </div>

                {/* Step 2 Card */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1e40af",
                    }}
                  >
                    2. Solution apportée (Action)
                  </span>
                  <span style={{ fontSize: 12, color: "#1e3a8a" }}>
                    Comment votre solution lève-t-elle concrètement ce blocage ?
                  </span>
                  <textarea
                    rows={3}
                    value={studio.solutionApportee}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        solutionApportee: e.target.value,
                      }))
                    }
                    placeholder="Ex: Un espace d'orientation anonyme, validé par des professionnels et accessible en 2 clics..."
                    className="eic-form-textarea"
                    style={{ background: "#ffffff", fontSize: 13 }}
                  />
                </div>

                {/* Step 3 Card */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    3. Bénéfice client mesurable
                  </span>
                  <span style={{ fontSize: 12, color: "#14532d" }}>
                    Quelle est la transformation concrète et mesurable obtenue ?
                  </span>
                  <textarea
                    rows={3}
                    value={studio.beneficeClientMesurable}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        beneficeClientMesurable: e.target.value,
                      }))
                    }
                    placeholder="Ex: Une réponse fiable en moins de 3 minutes et un parcours de prise en charge rassurant..."
                    className="eic-form-textarea"
                    style={{ background: "#ffffff", fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Message Central Synthèse */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "2px solid #0B2545",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0B2545",
                    }}
                  >
                    🎯 Message central de synthèse (Slogan / Pitch marketing en
                    1 phrase)
                  </span>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    Formule conseillée : « Pour [cible] qui vit [problème],
                    [notre projet] permet de [bénéfice mesurable] grâce à
                    [différenciateur]. »
                  </span>
                  <input
                    type="text"
                    value={studio.messageCentralSynthese}
                    onChange={(e) =>
                      setStudio((prev) => ({
                        ...prev,
                        messageCentralSynthese: e.target.value,
                      }))
                    }
                    placeholder="Votre message central en 1 phrase mémorable..."
                    className="eic-form-input"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  />
                </label>
              </div>
            </section>

            {/* SECTION 2: DÉCLINAISON POUR DEUX AUDIENCES DISTINCTES */}
            <section
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#0B2545",
                  }}
                >
                  Étape 2 · Side-by-Side Comparison Studio
                </span>
                <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
                  2. Déclinaison pour Deux Audiences Distinctes
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                  Un même projet ne s&apos;adresse pas de la même façon à
                  l&apos;utilisateur final et au partenaire ou décideur.
                  Comparez vos deux déclinaisons côte à côte.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                  gap: 16,
                }}
              >
                {/* Audience A Card */}
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 16,
                    background: "#f8fafc",
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
                      borderBottom: "1px solid #e2e8f0",
                      paddingBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 14, color: "#0B2545" }}>
                      👥 Audience A — Utilisateur final / Client B2C
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#dbeafe",
                        color: "#1e40af",
                        fontWeight: 600,
                      }}
                    >
                      Cible Terrain
                    </span>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Profil de l&apos;audience
                    </span>
                    <input
                      type="text"
                      value={studio.audienceA.profilAudience}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceA",
                          "profilAudience",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: Étudiants / Jeunes 18-24 ans à Fès..."
                      className="eic-form-input"
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Angle d&apos;accroche
                    </span>
                    <textarea
                      rows={2}
                      value={studio.audienceA.angleAccroche}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceA",
                          "angleAccroche",
                          e.target.value,
                        )
                      }
                      placeholder="Quel bénéfice immédiat capte leur attention en 3 secondes ?"
                      className="eic-form-textarea"
                    />
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Ton de communication
                    </span>
                    <input
                      type="text"
                      value={studio.audienceA.tonCommunication}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceA",
                          "tonCommunication",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: Bienveillant, direct, décomplexé..."
                      className="eic-form-input"
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                      {TONE_SUGGESTIONS.slice(0, 2).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() =>
                            updateAudienceField(
                              "audienceA",
                              "tonCommunication",
                              suggestion,
                            )
                          }
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#475569",
                            cursor: "pointer",
                          }}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Objection principale à lever
                    </span>
                    <input
                      type="text"
                      value={studio.audienceA.objectionPrincipale}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceA",
                          "objectionPrincipale",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: « Est-ce vraiment anonyme et gratuit ? »"
                      className="eic-form-input"
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Call to Action (Appel à l&apos;action)
                    </span>
                    <input
                      type="text"
                      value={studio.audienceA.callToAction}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceA",
                          "callToAction",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: « Teste le diagnostic anonyme en 60 secondes »"
                      className="eic-form-input"
                    />
                  </label>
                </div>

                {/* Audience B Card */}
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 16,
                    background: "#f8fafc",
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
                      borderBottom: "1px solid #e2e8f0",
                      paddingBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 14, color: "#0B2545" }}>
                      🏛️ Audience B — Décideur B2B / Partenaire / Institutionnel
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 600,
                      }}
                    >
                      Cible Partenaire
                    </span>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Profil de l&apos;audience
                    </span>
                    <input
                      type="text"
                      value={studio.audienceB.profilAudience}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceB",
                          "profilAudience",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: Direction universitaire, ONG santé, Ministère..."
                      className="eic-form-input"
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Angle d&apos;accroche
                    </span>
                    <textarea
                      rows={2}
                      value={studio.audienceB.angleAccroche}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceB",
                          "angleAccroche",
                          e.target.value,
                        )
                      }
                      placeholder="Quel impact mesurable, gain d'efficacité ou alignement stratégique ?"
                      className="eic-form-textarea"
                    />
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Ton de communication
                    </span>
                    <input
                      type="text"
                      value={studio.audienceB.tonCommunication}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceB",
                          "tonCommunication",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: Institutionnel, factuel, orienté impact et sécurité..."
                      className="eic-form-input"
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                      {TONE_SUGGESTIONS.slice(1, 4).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() =>
                            updateAudienceField(
                              "audienceB",
                              "tonCommunication",
                              suggestion,
                            )
                          }
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#475569",
                            cursor: "pointer",
                          }}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Objection principale à lever
                    </span>
                    <input
                      type="text"
                      value={studio.audienceB.objectionPrincipale}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceB",
                          "objectionPrincipale",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: « Quelle conformité médicale et quel coût de déploiement ? »"
                      className="eic-form-input"
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      Call to Action (Appel à l&apos;action)
                    </span>
                    <input
                      type="text"
                      value={studio.audienceB.callToAction}
                      onChange={(e) =>
                        updateAudienceField(
                          "audienceB",
                          "callToAction",
                          e.target.value,
                        )
                      }
                      placeholder="Ex: « Planifier une démonstration pilote de 15 minutes »"
                      className="eic-form-input"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* SECTION 3: STUDIO D'EXEMPLES DE CONTENUS & PLATEFORMES */}
            <section
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 16,
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
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#0B2545",
                    }}
                  >
                    Étape 3 · Content Studio
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
                    3. Studio d&apos;Exemples de Contenus &amp; Plateformes
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                    Rédigez au moins 2 à 3 exemples concrets de publications,
                    messages ou scripts adaptés à vos plateformes et audiences.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addContentCard}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #0B2545",
                    background: "#0B2545",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter un exemple de contenu
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {studio.contentCards.map((card, index) => (
                  <div
                    key={card.id}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 10,
                      padding: 16,
                      background: "#f8fafc",
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
                        gap: 8,
                      }}
                    >
                      <strong style={{ fontSize: 14, color: "#0f172a" }}>
                        Exemple de contenu #{index + 1}
                      </strong>
                      {studio.contentCards.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeContentCard(card.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Supprimer
                        </button>
                      ) : null}
                    </div>

                    {/* Platform Selector Pills */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                        Plateforme / Canal
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {PLATFORM_OPTIONS.map((plat) => {
                          const active = card.plateforme === plat;
                          return (
                            <button
                              key={plat}
                              type="button"
                              onClick={() =>
                                updateContentCard(card.id, { plateforme: plat })
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: active
                                  ? "1px solid #0B2545"
                                  : "1px solid #cbd5e1",
                                background: active ? "#0B2545" : "#ffffff",
                                color: active ? "#ffffff" : "#334155",
                                fontSize: 12,
                                fontWeight: active ? 600 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {plat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Audience Target & Content Format Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                          Audience ciblée
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {AUDIENCE_CHOICES.map((aud) => {
                            const active = card.audienceCible === aud;
                            return (
                              <button
                                key={aud}
                                type="button"
                                onClick={() =>
                                  updateContentCard(card.id, {
                                    audienceCible: aud,
                                  })
                                }
                                style={{
                                  flex: 1,
                                  padding: "7px 10px",
                                  borderRadius: 8,
                                  border: active
                                    ? "1px solid #1e40af"
                                    : "1px solid #cbd5e1",
                                  background: active ? "#dbeafe" : "#ffffff",
                                  color: active ? "#1e3a8a" : "#334155",
                                  fontSize: 12,
                                  fontWeight: active ? 600 : 500,
                                  cursor: "pointer",
                                }}
                              >
                                {aud}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                          Format du contenu
                        </span>
                        <input
                          type="text"
                          value={card.formatContenu}
                          onChange={(e) =>
                            updateContentCard(card.id, {
                              formatContenu: e.target.value,
                            })
                          }
                          placeholder="Ex: Reel 30s témoignage, Carrousel 5 slides, Message WhatsApp..."
                          className="eic-form-input"
                        />
                      </label>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                        Texte ou Script d&apos;exemple concret
                      </span>
                      <textarea
                        rows={3}
                        value={card.texteOuScriptExemple}
                        onChange={(e) =>
                          updateContentCard(card.id, {
                            texteOuScriptExemple: e.target.value,
                          })
                        }
                        placeholder="Rédigez ici l'accroche exacte, le corps du post ou le script vidéo avec votre appel à l'action..."
                        className="eic-form-textarea"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Collapsible Markdown Preview */}
            <details
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 14px",
                background: "#f8fafc",
                fontSize: 12,
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                📄 Aperçu de la synthèse générée pour le mentor
              </summary>
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 6,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 12,
                  color: "#1e293b",
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {serializedMarkdown ||
                  "Remplissez au moins un champ de l'atelier pour générer la synthèse."}
              </pre>
            </details>

            {/* Submit & Auto-save Footer */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="submit"
                disabled={pending || serializedMarkdown.trim().length === 0}
                className="eic-button--submit"
                style={{
                  opacity:
                    pending || serializedMarkdown.trim().length === 0 ? 0.6 : 1,
                }}
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
