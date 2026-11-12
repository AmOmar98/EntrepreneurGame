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

type FunnelTierKey = "tam" | "sam" | "som";

type FunnelTierData = {
  volumeEstime: string;
  methodeCalculBottomUp: string;
  sourceDonnees: string;
};

type TargetClientProfile = {
  ciblePrioritaire: string;
  critereQualification: string;
  budgetMoyen: string;
  freinPrincipal: string;
};

export type CompetitorType = "direct" | "indirect" | "statu_quo";

export type CompetitorCard = {
  id: string;
  nom: string;
  type: CompetitorType;
  forces: string;
  faiblesses: string;
  prixEstime: string;
  notreAvantage: string;
};

type PositioningMatrix = {
  axeX: string;
  axeY: string;
  positionnementUnique: string;
};

type MarketPositioningStudioState = {
  funnel: Record<FunnelTierKey, FunnelTierData>;
  targetProfile: TargetClientProfile;
  competitors: CompetitorCard[];
  positioning: PositioningMatrix;
};

const SOURCE_SUGGESTIONS: string[] = [
  "HCP (Haut-Commissariat au Plan)",
  "Bank Al-Maghrib (BAM)",
  "Étude sectorielle / Fédération",
  "Ministère / Données publiques",
  "Entretiens terrain (L2)",
  "Observatoire TPME / OMPIC",
];

const FUNNEL_META: {
  key: FunnelTierKey;
  code: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  cardBg: string;
  widthPercent: string;
  volumePlaceholder: string;
  calculPlaceholder: string;
  sourcePlaceholder: string;
}[] = [
  {
    key: "tam",
    code: "TAM",
    title: "Marché Total (Total Addressable Market)",
    subtitle: "Demande globale à l'échelle nationale ou régionale si 100 % du secteur était couvert.",
    badgeColor: "#1e3a8a",
    badgeBg: "#dbeafe",
    borderColor: "#93c5fd",
    cardBg: "#f8fafc",
    widthPercent: "100%",
    volumePlaceholder: "Ex : 1,2 million d'étudiants et jeunes diplômés au Maroc (~600 M MAD/an)",
    calculPlaceholder: "Ex : 1 200 000 jeunes × 500 MAD dépensés en moyenne par an sur ce besoin",
    sourcePlaceholder: "Ex : HCP 2025, Statistiques Ministère Enseignement Supérieur...",
  },
  {
    key: "sam",
    code: "SAM",
    title: "Marché Disponible (Serviceable Available Market)",
    subtitle: "Segment réellement accessible avec votre canal, votre langue et votre périmètre géographique.",
    badgeColor: "#065f46",
    badgeBg: "#d1fae5",
    borderColor: "#6ee7b7",
    cardBg: "#f0fdf4",
    widthPercent: "94%",
    volumePlaceholder: "Ex : 180 000 étudiants dans l'axe Fès-Meknès & Rabat-Casablanca (~90 M MAD/an)",
    calculPlaceholder: "Ex : 180 000 profils équipés mobile × 500 MAD/an dans les universités partenaires",
    sourcePlaceholder: "Ex : Rapports universitaires régionaux, enquête terrain Idea'Wave...",
  },
  {
    key: "som",
    code: "SOM",
    title: "Marché Capturable à 1–3 ans (Serviceable Obtainable Market)",
    subtitle: "Part réaliste que votre équipe peut conquérir avec ses ressources sur les 12 à 36 premiers mois.",
    badgeColor: "#92400e",
    badgeBg: "#fef3c7",
    borderColor: "#fcd34d",
    cardBg: "#fffbeb",
    widthPercent: "88%",
    volumePlaceholder: "Ex : 3 600 clients actifs d'ici 24 mois (~1,8 M MAD de CA récurrent)",
    calculPlaceholder: "Ex : 150 nouveaux clients/mois × 24 mois × 500 MAD via partenariats BDE & B2B",
    sourcePlaceholder: "Ex : Taux de conversion observé lors de nos 10 entretiens terrain...",
  },
];

const COMPETITOR_TYPE_META: Record<
  CompetitorType,
  { label: string; badgeBg: string; badgeColor: string; borderColor: string }
> = {
  direct: {
    label: "Concurrent direct",
    badgeBg: "#fee2e2",
    badgeColor: "#991b1b",
    borderColor: "#fca5a5",
  },
  indirect: {
    label: "Solution indirecte",
    badgeBg: "#e0e7ff",
    badgeColor: "#3730a3",
    borderColor: "#a5b4fc",
  },
  statu_quo: {
    label: "Statu quo / Système D",
    badgeBg: "#fef3c7",
    badgeColor: "#92400e",
    borderColor: "#fcd34d",
  },
};

function createDefaultState(): MarketPositioningStudioState {
  return {
    funnel: {
      tam: {
        volumeEstime: "",
        methodeCalculBottomUp: "",
        sourceDonnees: "",
      },
      sam: {
        volumeEstime: "",
        methodeCalculBottomUp: "",
        sourceDonnees: "",
      },
      som: {
        volumeEstime: "",
        methodeCalculBottomUp: "",
        sourceDonnees: "",
      },
    },
    targetProfile: {
      ciblePrioritaire: "",
      critereQualification: "",
      budgetMoyen: "",
      freinPrincipal: "",
    },
    competitors: [
      {
        id: "comp-1",
        nom: "",
        type: "direct",
        forces: "",
        faiblesses: "",
        prixEstime: "",
        notreAvantage: "",
      },
      {
        id: "comp-2",
        nom: "",
        type: "statu_quo",
        forces: "",
        faiblesses: "",
        prixEstime: "",
        notreAvantage: "",
      },
    ],
    positioning: {
      axeX: "",
      axeY: "",
      positionnementUnique: "",
    },
  };
}

function isFunnelTierFilled(tier: FunnelTierData): boolean {
  return (
    tier.volumeEstime.trim().length > 0 ||
    tier.methodeCalculBottomUp.trim().length > 0 ||
    tier.sourceDonnees.trim().length > 0
  );
}

function isCompetitorFilled(c: CompetitorCard): boolean {
  return (
    c.nom.trim().length > 0 ||
    c.forces.trim().length > 0 ||
    c.faiblesses.trim().length > 0 ||
    c.prixEstime.trim().length > 0 ||
    c.notreAvantage.trim().length > 0
  );
}

function serializeStudioToMarkdown(
  deliverableTitle: string,
  studio: MarketPositioningStudioState,
): string {
  const hasFunnel =
    isFunnelTierFilled(studio.funnel.tam) ||
    isFunnelTierFilled(studio.funnel.sam) ||
    isFunnelTierFilled(studio.funnel.som);

  const hasTarget =
    studio.targetProfile.ciblePrioritaire.trim().length > 0 ||
    studio.targetProfile.critereQualification.trim().length > 0 ||
    studio.targetProfile.budgetMoyen.trim().length > 0 ||
    studio.targetProfile.freinPrincipal.trim().length > 0;

  const filledCompetitors = studio.competitors.filter(isCompetitorFilled);
  const hasPositioning =
    studio.positioning.axeX.trim().length > 0 ||
    studio.positioning.axeY.trim().length > 0 ||
    studio.positioning.positionnementUnique.trim().length > 0;

  if (!hasFunnel && !hasTarget && filledCompetitors.length === 0 && !hasPositioning) {
    return "";
  }

  const lines: string[] = [
    `# ${deliverableTitle || "Synthèse de l'étude de marché et profil des clients cibles"}`,
    "",
    "## 1. Entonnoir de Marché (TAM / SAM / SOM)",
  ];

  for (const tierMeta of FUNNEL_META) {
    const data = studio.funnel[tierMeta.key];
    lines.push(`### ${tierMeta.code} — ${tierMeta.title}`);
    lines.push(`- **Volume estimé :** ${data.volumeEstime.trim() || "_Non renseigné_"}`);
    lines.push(
      `- **Méthode de calcul (Bottom-Up) :** ${data.methodeCalculBottomUp.trim() || "_Non renseigné_"}`,
    );
    lines.push(`- **Sources des données :** ${data.sourceDonnees.trim() || "_Non renseigné_"}`);
    lines.push("");
  }

  lines.push("## 2. Profil des Clients Cibles (Beachhead & Early Adopters)");
  lines.push(
    `- **Cible prioritaire (qui achète en premier ?) :** ${studio.targetProfile.ciblePrioritaire.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Critères de qualification (comment les reconnaître ?) :** ${studio.targetProfile.critereQualification.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Budget moyen / Capacité à payer :** ${studio.targetProfile.budgetMoyen.trim() || "_Non renseigné_"}`,
  );
  lines.push(
    `- **Frein principal à l'adoption :** ${studio.targetProfile.freinPrincipal.trim() || "_Non renseigné_"}`,
  );
  lines.push("");

  lines.push("## 3. Cartographie de la Concurrence & Positionnement");
  lines.push("### Alternatives & Concurrents analysés");
  if (filledCompetitors.length === 0) {
    lines.push("_Aucun concurrent renseigné._");
    lines.push("");
  } else {
    filledCompetitors.forEach((comp, idx) => {
      const typeLabel = COMPETITOR_TYPE_META[comp.type]?.label ?? comp.type;
      lines.push(`#### ${idx + 1}. ${comp.nom.trim() || `Alternative #${idx + 1}`} (${typeLabel})`);
      lines.push(`- **Forces :** ${comp.forces.trim() || "_Non renseigné_"}`);
      lines.push(`- **Faiblesses / Limites :** ${comp.faiblesses.trim() || "_Non renseigné_"}`);
      lines.push(`- **Prix estimé :** ${comp.prixEstime.trim() || "_Non renseigné_"}`);
      lines.push(`- **Notre avantage différenciant :** ${comp.notreAvantage.trim() || "_Non renseigné_"}`);
      lines.push("");
    });
  }

  lines.push("### Axes de différenciation & Positionnement unique");
  lines.push(`- **Axe X (Différenciation 1) :** ${studio.positioning.axeX.trim() || "_Non renseigné_"}`);
  lines.push(`- **Axe Y (Différenciation 2) :** ${studio.positioning.axeY.trim() || "_Non renseigné_"}`);
  lines.push(
    `- **Positionnement unique du projet :** ${studio.positioning.positionnementUnique.trim() || "_Non renseigné_"}`,
  );

  return lines.join("\n").slice(0, 15500);
}

export function MarketPositioningComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
  initialProofUrl,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "external">(
    initialProofUrl && initialProofUrl.trim().length > 0 ? "external" : "studio",
  );
  const [studio, setStudio] = useState<MarketPositioningStudioState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  const [state, formAction, pending] = useActionState(submitDeliverable, initialState);
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
        const parsed = JSON.parse(raw) as Partial<MarketPositioningStudioState>;
        setStudio((prev) => ({
          funnel: {
            tam: { ...prev.funnel.tam, ...(parsed.funnel?.tam ?? {}) },
            sam: { ...prev.funnel.sam, ...(parsed.funnel?.sam ?? {}) },
            som: { ...prev.funnel.som, ...(parsed.funnel?.som ?? {}) },
          },
          targetProfile: {
            ...prev.targetProfile,
            ...(parsed.targetProfile ?? {}),
          },
          competitors:
            Array.isArray(parsed.competitors) && parsed.competitors.length > 0
              ? parsed.competitors.map((c, idx) => ({
                  id: typeof c.id === "string" && c.id ? c.id : `comp-${idx + 1}`,
                  nom: typeof c.nom === "string" ? c.nom : "",
                  type:
                    c.type === "direct" || c.type === "indirect" || c.type === "statu_quo"
                      ? c.type
                      : "direct",
                  forces: typeof c.forces === "string" ? c.forces : "",
                  faiblesses: typeof c.faiblesses === "string" ? c.faiblesses : "",
                  prixEstime: typeof c.prixEstime === "string" ? c.prixEstime : "",
                  notreAvantage: typeof c.notreAvantage === "string" ? c.notreAvantage : "",
                }))
              : prev.competitors,
          positioning: {
            ...prev.positioning,
            ...(parsed.positioning ?? {}),
          },
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore storage errors silently (R3: never block).
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Persist studio state to localStorage on every change after hydration.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Quota or private browsing — fail silently (R3).
    }
  }, [studio, hydrated, storageKey]);

  // Handle post-submission analytics, storage cleanup, and route refresh.
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
          // Ignore storage errors.
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, storageKey, router]);

  const serializedMarkdown = useMemo(
    () => serializeStudioToMarkdown(deliverableTitle, studio),
    [deliverableTitle, studio],
  );

  // R2 Pedagogical completion progress (warn-only, never blocks submission).
  const sectionStatus = useMemo(() => {
    const s1Complete =
      isFunnelTierFilled(studio.funnel.tam) &&
      isFunnelTierFilled(studio.funnel.sam) &&
      isFunnelTierFilled(studio.funnel.som);
    const s2Complete =
      studio.targetProfile.ciblePrioritaire.trim().length > 0 &&
      studio.targetProfile.critereQualification.trim().length > 0;
    const s3Complete =
      studio.competitors.some(isCompetitorFilled) &&
      (studio.positioning.axeX.trim().length > 0 ||
        studio.positioning.axeY.trim().length > 0 ||
        studio.positioning.positionnementUnique.trim().length > 0);
    const completedCount = [s1Complete, s2Complete, s3Complete].filter(Boolean).length;
    return { s1Complete, s2Complete, s3Complete, completedCount };
  }, [studio]);

  function updateFunnelTier(
    tier: FunnelTierKey,
    field: keyof FunnelTierData,
    value: string,
  ) {
    setStudio((prev) => ({
      ...prev,
      funnel: {
        ...prev.funnel,
        [tier]: {
          ...prev.funnel[tier],
          [field]: value,
        },
      },
    }));
  }

  function appendSourceSuggestion(tier: FunnelTierKey, suggestion: string) {
    setStudio((prev) => {
      const current = prev.funnel[tier].sourceDonnees.trim();
      if (current.toLowerCase().includes(suggestion.toLowerCase())) {
        return prev;
      }
      const nextValue = current.length > 0 ? `${current}, ${suggestion}` : suggestion;
      return {
        ...prev,
        funnel: {
          ...prev.funnel,
          [tier]: {
            ...prev.funnel[tier],
            sourceDonnees: nextValue,
          },
        },
      };
    });
  }

  function updateTargetProfile(field: keyof TargetClientProfile, value: string) {
    setStudio((prev) => ({
      ...prev,
      targetProfile: {
        ...prev.targetProfile,
        [field]: value,
      },
    }));
  }

  function addCompetitor(defaultType: CompetitorType = "direct") {
    setStudio((prev) => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        {
          id: `comp-${Date.now()}-${prev.competitors.length + 1}`,
          nom: "",
          type: defaultType,
          forces: "",
          faiblesses: "",
          prixEstime: "",
          notreAvantage: "",
        },
      ],
    }));
  }

  function updateCompetitor<K extends keyof CompetitorCard>(
    id: string,
    field: K,
    value: CompetitorCard[K],
  ) {
    setStudio((prev) => ({
      ...prev,
      competitors: prev.competitors.map((comp) =>
        comp.id === id ? { ...comp, [field]: value } : comp,
      ),
    }));
  }

  function removeCompetitor(id: string) {
    setStudio((prev) => {
      if (prev.competitors.length <= 1) {
        return {
          ...prev,
          competitors: [
            {
              id: "comp-1",
              nom: "",
              type: "direct",
              forces: "",
              faiblesses: "",
              prixEstime: "",
              notreAvantage: "",
            },
          ],
        };
      }
      return {
        ...prev,
        competitors: prev.competitors.filter((comp) => comp.id !== id),
      };
    });
  }

  function moveCompetitor(index: number, direction: -1 | 1) {
    setStudio((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.competitors.length) return prev;
      const copy = [...prev.competitors];
      const [item] = copy.splice(index, 1);
      if (!item) return prev;
      copy.splice(targetIndex, 0, item);
      return { ...prev, competitors: copy };
    });
  }

  function updatePositioning(field: keyof PositioningMatrix, value: string) {
    setStudio((prev) => ({
      ...prev,
      positioning: {
        ...prev.positioning,
        [field]: value,
      },
    }));
  }

  const submitLabel = version === 2 ? t.submission_v2_submit : t.submission_submit;

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
          borderRadius: 12,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Format de remise du livrable
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            Construisez votre étude de marché pas à pas ou soumettez un lien / texte libre.
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Mode de saisie du livrable"
          style={{
            display: "inline-flex",
            gap: 6,
            padding: 4,
            borderRadius: 10,
            background: "#e2e8f0",
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "studio"}
            onClick={() => setMode("studio")}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "studio" ? "#1e3a8a" : "transparent",
              color: mode === "studio" ? "#ffffff" : "#334155",
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
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "external" ? "#1e3a8a" : "transparent",
              color: mode === "external" ? "#ffffff" : "#334155",
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
        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <input type="hidden" name="deliverableTemplateId" value={deliverableTemplateId} />
          <input type="hidden" name="kind" value="proof_text" />
          <input type="hidden" name="proofText" value={serializedMarkdown} />

          {/* R2 Warn-only pedagogical progress indicator */}
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              background: sectionStatus.completedCount === 3 ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${sectionStatus.completedCount === 3 ? "#86efac" : "#fcd34d"}`,
              color: sectionStatus.completedCount === 3 ? "#166534" : "#92400e",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700 }}>
                Progression de l&apos;atelier : {sectionStatus.completedCount} / 3 volets complétés
              </span>
              <span>
                {sectionStatus.completedCount === 3
                  ? "— Votre synthèse marché & positionnement est complète."
                  : "— Repère pédagogique indicatif (vous pouvez soumettre à tout moment dès qu'une section est renseignée)."}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: sectionStatus.s1Complete ? "#dcfce7" : "#fef3c7",
                  color: sectionStatus.s1Complete ? "#166534" : "#92400e",
                  fontWeight: 600,
                }}
              >
                {sectionStatus.s1Complete ? "✓" : "•"} 1. TAM/SAM/SOM
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: sectionStatus.s2Complete ? "#dcfce7" : "#fef3c7",
                  color: sectionStatus.s2Complete ? "#166534" : "#92400e",
                  fontWeight: 600,
                }}
              >
                {sectionStatus.s2Complete ? "✓" : "•"} 2. Clients cibles
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: sectionStatus.s3Complete ? "#dcfce7" : "#fef3c7",
                  color: sectionStatus.s3Complete ? "#166534" : "#92400e",
                  fontWeight: 600,
                }}
              >
                {sectionStatus.s3Complete ? "✓" : "•"} 3. Concurrence & Axes
              </span>
            </div>
          </div>

          {/* SECTION 1 : Entonnoir de Marché TAM / SAM / SOM */}
          <section
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#1d4ed8",
                }}
              >
                Volet 1 sur 3 · Dimensionnement du marché
              </div>
              <h2 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                1. Entonnoir de Marché TAM / SAM / SOM (Approche Bottom-Up)
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                Privilégiez un calcul <strong>Bottom-Up</strong> concret (nombre de clients cibles × panier annuel moyen) plutôt qu&apos;un pourcentage abstrait d&apos;un marché macroéconomique.
              </p>
            </div>

            {/* Stepped / Concentric Funnel Cards */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              {FUNNEL_META.map((tier, index) => {
                const tierData = studio.funnel[tier.key];
                const filled = isFunnelTierFilled(tierData);
                return (
                  <div
                    key={tier.key}
                    style={{
                      width: tier.widthPercent,
                      maxWidth: "100%",
                      padding: 16,
                      borderRadius: 12,
                      background: tier.cardBg,
                      border: `2px solid ${tier.borderColor}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      transition: "all 0.15s ease",
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
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: tier.badgeBg,
                            color: tier.badgeColor,
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {index + 1}. {tier.code}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                            {tier.title}
                          </div>
                          <div style={{ fontSize: 12, color: "#475569" }}>{tier.subtitle}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: filled ? "#15803d" : "#64748b",
                        }}
                      >
                        {filled ? "✓ Renseigné" : "À compléter"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Volume estimé (clients & valeur en MAD)
                        </span>
                        <input
                          type="text"
                          value={tierData.volumeEstime}
                          onChange={(e) =>
                            updateFunnelTier(tier.key, "volumeEstime", e.target.value)
                          }
                          placeholder={tier.volumePlaceholder}
                          className="eic-form-input"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Méthode de calcul Bottom-Up (formule)
                        </span>
                        <input
                          type="text"
                          value={tierData.methodeCalculBottomUp}
                          onChange={(e) =>
                            updateFunnelTier(tier.key, "methodeCalculBottomUp", e.target.value)
                          }
                          placeholder={tier.calculPlaceholder}
                          className="eic-form-input"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Sources des données (institutionnelles, sectorielles, terrain)
                        </span>
                        <input
                          type="text"
                          value={tierData.sourceDonnees}
                          onChange={(e) =>
                            updateFunnelTier(tier.key, "sourceDonnees", e.target.value)
                          }
                          placeholder={tier.sourcePlaceholder}
                          className="eic-form-input"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Ajout rapide de source :
                        </span>
                        {SOURCE_SUGGESTIONS.map((source) => (
                          <button
                            key={source}
                            type="button"
                            onClick={() => appendSourceSuggestion(tier.key, source)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            + {source}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 2 : Profil des Clients Cibles (Beachhead & Early Adopters) */}
          <section
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#047857",
                }}
              >
                Volet 2 sur 3 · Beachhead & Early Adopters
              </div>
              <h2 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                2. Profil des Clients Cibles (Qui achète en premier ?)
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                Définissez votre segment <strong>Beachhead</strong> (tête de pont) : les clients qui ressentent l&apos;urgence la plus forte et sont prêts à adopter votre V1 dès maintenant.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {/* Card 1: Cible prioritaire */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    🎯 Cible prioritaire (qui achète en premier ?)
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Décrivez précisément le décideur ou l&apos;utilisateur final prioritaire (B2C, B2B, B2G).
                  </span>
                  <textarea
                    rows={3}
                    value={studio.targetProfile.ciblePrioritaire}
                    onChange={(e) => updateTargetProfile("ciblePrioritaire", e.target.value)}
                    placeholder="Ex : Cliniques privées et cabinets médicaux de taille moyenne (3 à 10 praticiens) à Fès et Casablanca..."
                    className="eic-form-textarea"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  />
                </label>
              </div>

              {/* Card 2: Critère de qualification */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    🔍 Critères de qualification (comment les reconnaître ?)
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Quels signaux observables prouvent que ce client a un besoin immédiat ?
                  </span>
                  <textarea
                    rows={3}
                    value={studio.targetProfile.critereQualification}
                    onChange={(e) => updateTargetProfile("critereQualification", e.target.value)}
                    placeholder="Ex : Plus de 40 RDV/jour gérés sur papier ou WhatsApp, taux d'absentéisme patient > 15%..."
                    className="eic-form-textarea"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  />
                </label>
              </div>

              {/* Card 3: Budget moyen */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    💳 Budget moyen & propension à payer
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Combien dépensent-ils aujourd&apos;hui pour ce problème et à quelle fréquence ?
                  </span>
                  <textarea
                    rows={3}
                    value={studio.targetProfile.budgetMoyen}
                    onChange={(e) => updateTargetProfile("budgetMoyen", e.target.value)}
                    placeholder="Ex : 400 à 800 MAD / mois par cabinet (ou coût actuel d'une assistante dédiée à temps partiel)..."
                    className="eic-form-textarea"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  />
                </label>
              </div>

              {/* Card 4: Frein principal */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    🚧 Frein principal à l&apos;achat / l&apos;adoption
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Quelle est l&apos;objection n°1 à lever (temps de formation, confiance, coût de migration) ?
                  </span>
                  <textarea
                    rows={3}
                    value={studio.targetProfile.freinPrincipal}
                    onChange={(e) => updateTargetProfile("freinPrincipal", e.target.value)}
                    placeholder="Ex : Peur de perdre l'historique des dossiers patients et manque de temps pour former le secrétariat..."
                    className="eic-form-textarea"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 3 : Cartographie de la Concurrence & Positionnement */}
          <section
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#7c3aed",
                  }}
                >
                  Volet 3 sur 3 · Benchmark & Matrice de différenciation
                </div>
                <h2 style={{ margin: "4px 0 4px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  3. Cartographie de la Concurrence & Positionnement
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                  Analysez vos concurrents directs, les solutions indirectes et le <strong>statu quo</strong> (Excel, WhatsApp, papier), puis définissez vos 2 axes de différenciation.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => addCompetitor("direct")}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid #1e3a8a",
                    background: "#1e3a8a",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter un concurrent
                </button>
                <button
                  type="button"
                  onClick={() => addCompetitor("statu_quo")}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Ajouter un Statu quo
                </button>
              </div>
            </div>

            {/* Competitor Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {studio.competitors.map((comp, idx) => {
                const typeMeta = COMPETITOR_TYPE_META[comp.type];
                return (
                  <div
                    key={comp.id}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "#f8fafc",
                      border: `1px solid ${typeMeta.borderColor}`,
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#475569",
                          }}
                        >
                          Alternative #{idx + 1}
                        </span>
                        {(["direct", "indirect", "statu_quo"] as CompetitorType[]).map((tKey) => {
                          const meta = COMPETITOR_TYPE_META[tKey];
                          const active = comp.type === tKey;
                          return (
                            <button
                              key={tKey}
                              type="button"
                              onClick={() => updateCompetitor(comp.id, "type", tKey)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                border: `1px solid ${active ? meta.badgeColor : "#cbd5e1"}`,
                                background: active ? meta.badgeBg : "#ffffff",
                                color: active ? meta.badgeColor : "#475569",
                                fontSize: 11,
                                fontWeight: active ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => moveCompetitor(idx, -1)}
                          disabled={idx === 0}
                          aria-label={`Monter l'alternative ${idx + 1}`}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            fontSize: 11,
                            cursor: idx === 0 ? "default" : "pointer",
                            opacity: idx === 0 ? 0.4 : 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCompetitor(idx, 1)}
                          disabled={idx === studio.competitors.length - 1}
                          aria-label={`Descendre l'alternative ${idx + 1}`}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            fontSize: 11,
                            cursor: idx === studio.competitors.length - 1 ? "default" : "pointer",
                            opacity: idx === studio.competitors.length - 1 ? 0.4 : 1,
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCompetitor(comp.id)}
                          aria-label={`Supprimer l'alternative ${idx + 1}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            fontSize: 11,
                            fontWeight: 600,
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
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Nom de l&apos;acteur ou habitude actuelle
                        </span>
                        <input
                          type="text"
                          value={comp.nom}
                          onChange={(e) => updateCompetitor(comp.id, "nom", e.target.value)}
                          placeholder="Ex : DabaDoc / Gestion WhatsApp + Excel..."
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Prix estimé / Coût pour le client
                        </span>
                        <input
                          type="text"
                          value={comp.prixEstime}
                          onChange={(e) => updateCompetitor(comp.id, "prixEstime", e.target.value)}
                          placeholder="Ex : 500 MAD/mois ou Gratuit mais 6h perdues/semaine"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Forces (pourquoi les clients l&apos;utilisent)
                        </span>
                        <input
                          type="text"
                          value={comp.forces}
                          onChange={(e) => updateCompetitor(comp.id, "forces", e.target.value)}
                          placeholder="Ex : Notoriété établie, habitude déjà installée..."
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Faiblesses / Angle mort
                        </span>
                        <input
                          type="text"
                          value={comp.faiblesses}
                          onChange={(e) => updateCompetitor(comp.id, "faiblesses", e.target.value)}
                          placeholder="Ex : Pas adapté aux PME locales, interface complexe, pas de suivi..."
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                          Notre avantage décisif face à eux
                        </span>
                        <input
                          type="text"
                          value={comp.notreAvantage}
                          onChange={(e) =>
                            updateCompetitor(comp.id, "notreAvantage", e.target.value)
                          }
                          placeholder="Ex : Déploiement en 10 min en Darija/FR sur WhatsApp, 2× plus abordable"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            background: "#ffffff",
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2-Axis Positioning Matrix Builder */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#2e1065" }}>
                  Matrice de Positionnement à 2 Axes
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "#4c1d95" }}>
                  Choisissez les 2 critères sur lesquels votre solution se démarque nettement aux yeux de votre cible prioritaire.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2e1065" }}>
                    Axe Horizontal (Axe X) — Critère différenciant n°1
                  </span>
                  <input
                    type="text"
                    value={studio.positioning.axeX}
                    onChange={(e) => updatePositioning("axeX", e.target.value)}
                    placeholder="Ex : Simplicité & rapidité de prise en main (Générique → Ultra-intuitif)"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #c4b5fd",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2e1065" }}>
                    Axe Vertical (Axe Y) — Critère différenciant n°2
                  </span>
                  <input
                    type="text"
                    value={studio.positioning.axeY}
                    onChange={(e) => updatePositioning("axeY", e.target.value)}
                    placeholder="Ex : Adaptation au contexte marocain & accessibilité tarifaire"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #c4b5fd",
                      fontSize: 13,
                      background: "#ffffff",
                    }}
                  />
                </label>
              </div>

              {/* Visual 2x2 Quadrant Preview */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  padding: 12,
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1px dashed #a78bfa",
                }}
              >
                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    ↖ Fort sur ({studio.positioning.axeY.trim() || "Axe Y"}) · Faible sur (
                    {studio.positioning.axeX.trim() || "Axe X"})
                  </div>
                  <div>
                    Alternatives locales traditionnelles ou statu quo :{" "}
                    {studio.competitors
                      .filter((c) => c.type === "statu_quo" && c.nom.trim())
                      .map((c) => c.nom.trim())
                      .join(", ") || "Système D / Manuel"}
                  </div>
                </div>

                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#ede9fe",
                    border: "2px solid #7c3aed",
                    fontSize: 12,
                    color: "#2e1065",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#5b21b6", marginBottom: 4 }}>
                    ↗ VOTRE QUADRANT CIBLE ({studio.positioning.axeX.trim() || "Axe X"} +{" "}
                    {studio.positioning.axeY.trim() || "Axe Y"})
                  </div>
                  <div>
                    {studio.positioning.positionnementUnique.trim() ||
                      "Votre proposition de valeur unique se positionne ici."}
                  </div>
                </div>

                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    ↙ Faible différenciation sur les 2 axes
                  </div>
                  <div>Offres génériques non spécialisées</div>
                </div>

                <div
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    ↘ Fort sur ({studio.positioning.axeX.trim() || "Axe X"}) · Faible sur (
                    {studio.positioning.axeY.trim() || "Axe Y"})
                  </div>
                  <div>
                    Concurrents directs / internationaux :{" "}
                    {studio.competitors
                      .filter((c) => c.type !== "statu_quo" && c.nom.trim())
                      .map((c) => c.nom.trim())
                      .join(", ") || "Outils standards coûteux"}
                  </div>
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2e1065" }}>
                  Synthèse de votre positionnement unique (Quadrant supérieur droit)
                </span>
                <textarea
                  rows={3}
                  value={studio.positioning.positionnementUnique}
                  onChange={(e) =>
                    updatePositioning("positionnementUnique", e.target.value)
                  }
                  placeholder="Ex : Contrairement aux logiciels étrangers coûteux et au bricolage sur WhatsApp, notre solution offre aux cliniques marocaines un suivi automatisé en Darija/FR opérationnel en 10 minutes pour 400 MAD/mois."
                  className="eic-form-textarea"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #c4b5fd",
                    fontSize: 13,
                    background: "#ffffff",
                  }}
                />
              </label>
            </div>
          </section>

          {/* Optional Markdown Preview Toggle */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 10,
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
              <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Synthèse Markdown générée automatiquement pour le Mentor
              </span>
              <button
                type="button"
                onClick={() => setShowMarkdownPreview((v) => !v)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e3a8a",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showMarkdownPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
              </button>
            </div>
            {showMarkdownPreview ? (
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 8,
                  background: "#0f172a",
                  color: "#f8fafc",
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {serializedMarkdown ||
                  "Remplissez au moins un champ de l'atelier pour générer la synthèse Markdown."}
              </pre>
            ) : null}
          </div>

          {/* Submit Footer + AutoSaveBadge */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
