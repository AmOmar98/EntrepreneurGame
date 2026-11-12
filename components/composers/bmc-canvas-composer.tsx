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
const initialActionState: WorkflowState = { ok: false, message: "" };

export type InteractiveDeliverableComposerProps = {
  deliverableTemplateId: string;
  deliverableSlug: string;
  deliverableTitle: string;
  playerId?: string | null;
  version?: 1 | 2;
  initialProofText?: string | null;
  initialProofUrl?: string | null;
};

export type BmcBlockKey =
  | "partenaires_cles"
  | "activites_cles"
  | "ressources_cles"
  | "proposition_valeur"
  | "relation_client"
  | "canaux"
  | "segments_clients"
  | "structure_couts"
  | "sources_revenus";

export type BmcStickyCard = {
  id: string;
  text: string;
};

export type ValuePropositionPitch = {
  cible: string;
  nomOffre: string;
  categorie: string;
  beneficeCle: string;
  alternative: string;
  differenciation: string;
  placeChaineDeValeur: string;
  detailChaineDeValeur: string;
};

export type BmcStudioState = {
  pitch: ValuePropositionPitch;
  blocks: Record<BmcBlockKey, BmcStickyCard[]>;
};

type BlockTheme = "infrastructure" | "value" | "customer" | "finance";

type BmcBlockDefinition = {
  key: BmcBlockKey;
  number: string;
  title: string;
  subtitle: string;
  placeholder: string;
  theme: BlockTheme;
  gridArea: string;
};

const VALUE_CHAIN_OPTIONS = [
  "B2C (Direct consommateur)",
  "B2B (Entreprises & PME)",
  "B2B2C (Via partenaire)",
  "Plateforme / Marketplace",
  "Fournisseur / Producteur",
  "Distributeur / Intégrateur",
] as const;

const BMC_BLOCKS: BmcBlockDefinition[] = [
  {
    key: "partenaires_cles",
    number: "01",
    title: "Partenaires clés",
    subtitle: "Fournisseurs, alliés stratégiques, institutions",
    placeholder: "Ex: Coopératives locales, incubateur, prestataire logistique...",
    theme: "infrastructure",
    gridArea: "kp",
  },
  {
    key: "activites_cles",
    number: "02",
    title: "Activités clés",
    subtitle: "Ce que nous devons faire excellemment",
    placeholder: "Ex: Développement produit, acquisition terrain, contrôle qualité...",
    theme: "infrastructure",
    gridArea: "ka",
  },
  {
    key: "ressources_cles",
    number: "03",
    title: "Ressources clés",
    subtitle: "Actifs humains, technologiques, financiers",
    placeholder: "Ex: Équipe R&D, brevet / algorithme, réseau de mentors...",
    theme: "infrastructure",
    gridArea: "kr",
  },
  {
    key: "proposition_valeur",
    number: "04",
    title: "Proposition de valeur",
    subtitle: "La promesse centrale & valeur délivrée au client",
    placeholder: "Ex: Gain de 3h/semaine, réduction de coût de 40%, zéro papier...",
    theme: "value",
    gridArea: "vp",
  },
  {
    key: "relation_client",
    number: "05",
    title: "Relations clients",
    subtitle: "Accompagnement, fidélisation, communauté",
    placeholder: "Ex: Onboarding dédié, support WhatsApp 7j/7, self-service...",
    theme: "customer",
    gridArea: "cr",
  },
  {
    key: "canaux",
    number: "06",
    title: "Canaux de distribution",
    subtitle: "Comment nous touchons et livrons nos clients",
    placeholder: "Ex: Vente directe B2B, application mobile, réseaux sociaux...",
    theme: "customer",
    gridArea: "ch",
  },
  {
    key: "segments_clients",
    number: "07",
    title: "Segments de clientèle",
    subtitle: "Qui sont nos premiers clients payants (early adopters)",
    placeholder: "Ex: Étudiants urbains 18-25 ans, PME industrielles au Maroc...",
    theme: "customer",
    gridArea: "cs",
  },
  {
    key: "structure_couts",
    number: "08",
    title: "Structure de coûts",
    subtitle: "Principaux postes de dépenses fixes et variables",
    placeholder: "Ex: Hébergement cloud, coûts d'acquisition, matière première...",
    theme: "finance",
    gridArea: "cost",
  },
  {
    key: "sources_revenus",
    number: "09",
    title: "Sources de revenus",
    subtitle: "Modèle de monétisation, tarification, récurrence",
    placeholder: "Ex: Abonnement mensuel SaaS, commission 10%, vente unitaire...",
    theme: "finance",
    gridArea: "rev",
  },
];

const THEME_STYLES: Record<
  BlockTheme,
  {
    border: string;
    bg: string;
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    stickyBg: string;
    stickyBorder: string;
    accentText: string;
  }
> = {
  infrastructure: {
    border: "#94a3b8",
    bg: "#f8fafc",
    headerBg: "#e2e8f0",
    badgeBg: "#334155",
    badgeText: "#ffffff",
    stickyBg: "#ffffff",
    stickyBorder: "#cbd5e1",
    accentText: "#1e293b",
  },
  value: {
    border: "#f59e0b",
    bg: "#fffbeb",
    headerBg: "#fef3c7",
    badgeBg: "#b45309",
    badgeText: "#ffffff",
    stickyBg: "#ffffff",
    stickyBorder: "#fcd34d",
    accentText: "#78350f",
  },
  customer: {
    border: "#10b981",
    bg: "#ecfdf5",
    headerBg: "#d1fae5",
    badgeBg: "#047857",
    badgeText: "#ffffff",
    stickyBg: "#ffffff",
    stickyBorder: "#6ee7b7",
    accentText: "#064e3b",
  },
  finance: {
    border: "#6366f1",
    bg: "#eef2ff",
    headerBg: "#e0e7ff",
    badgeBg: "#4338ca",
    badgeText: "#ffffff",
    stickyBg: "#ffffff",
    stickyBorder: "#a5b4fc",
    accentText: "#1e1b4b",
  },
};

function createEmptyState(): BmcStudioState {
  return {
    pitch: {
      cible: "",
      nomOffre: "",
      categorie: "",
      beneficeCle: "",
      alternative: "",
      differenciation: "",
      placeChaineDeValeur: "B2C (Direct consommateur)",
      detailChaineDeValeur: "",
    },
    blocks: {
      partenaires_cles: [],
      activites_cles: [],
      ressources_cles: [],
      proposition_valeur: [],
      relation_client: [],
      canaux: [],
      segments_clients: [],
      structure_couts: [],
      sources_revenus: [],
    },
  };
}

function makeCardId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function serializeBmcToMarkdown(
  deliverableTitle: string,
  state: BmcStudioState,
): string {
  const { pitch, blocks } = state;

  const pitchSentenceParts = [
    `Pour **${pitch.cible.trim() || "[cible à préciser]"}**`,
    `notre offre **${pitch.nomOffre.trim() || "[nom de l'offre]"}**`,
    `est **${pitch.categorie.trim() || "[catégorie de solution]"}**`,
    `qui apporte **${pitch.beneficeCle.trim() || "[bénéfice clé mesurable]"}**`,
    `contrairement à **${pitch.alternative.trim() || "[alternative actuelle]"}**`,
    `grâce à **${pitch.differenciation.trim() || "[élément de différenciation]"}**.`,
  ].join(", ");

  const lines: string[] = [
    `# ${deliverableTitle || "Proposition de valeur et Business Model Canvas initial"}`,
    "",
    "## 1. Proposition de Valeur & Positionnement dans la Chaîne de Valeur",
    "",
    `> ${pitchSentenceParts}`,
    "",
    `- **Segment cible** : ${pitch.cible.trim() || "Non renseigné"}`,
    `- **Nom de l'offre** : ${pitch.nomOffre.trim() || "Non renseigné"}`,
    `- **Catégorie** : ${pitch.categorie.trim() || "Non renseigné"}`,
    `- **Bénéfice clé** : ${pitch.beneficeCle.trim() || "Non renseigné"}`,
    `- **Alternative concurrente** : ${pitch.alternative.trim() || "Non renseigné"}`,
    `- **Différenciation clé** : ${pitch.differenciation.trim() || "Non renseigné"}`,
    `- **Place dans la chaîne de valeur** : ${pitch.placeChaineDeValeur.trim() || "Non renseigné"}${
      pitch.detailChaineDeValeur.trim()
        ? ` — ${pitch.detailChaineDeValeur.trim()}`
        : ""
    }`,
    "",
    "## 2. Business Model Canvas (9 Blocs)",
    "",
  ];

  for (const def of BMC_BLOCKS) {
    const cards = (blocks[def.key] ?? []).filter(
      (c) => c.text.trim().length > 0,
    );
    lines.push(`### ${def.number}. ${def.title}`);
    if (cards.length === 0) {
      lines.push("- _(Aucun élément renseigné pour ce bloc)_");
    } else {
      for (const card of cards) {
        lines.push(`- ${card.text.trim()}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function BmcCanvasComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
  initialProofUrl,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "classic">(
    initialProofUrl && initialProofUrl.trim().length > 0 ? "classic" : "studio",
  );
  const [studio, setStudio] = useState<BmcStudioState>(createEmptyState);
  const [draftInputs, setDraftInputs] = useState<Record<BmcBlockKey, string>>({
    partenaires_cles: "",
    activites_cles: "",
    ressources_cles: "",
    proposition_valeur: "",
    relation_client: "",
    canaux: "",
    segments_clients: "",
    structure_couts: "",
    sources_revenus: "",
  });
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [state, formAction, pending] = useActionState(
    submitDeliverable,
    initialActionState,
  );
  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  const studioStorageKey = useMemo(
    () =>
      `${buildDraftStorageKey({ playerId, deliverableTemplateId, version })}_studio`,
    [playerId, deliverableTemplateId, version],
  );

  // Hydrate studio state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(studioStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BmcStudioState>;
        const empty = createEmptyState();
        const nextBlocks: Record<BmcBlockKey, BmcStickyCard[]> = {
          ...empty.blocks,
        };
        if (parsed.blocks && typeof parsed.blocks === "object") {
          for (const def of BMC_BLOCKS) {
            const arr = parsed.blocks[def.key];
            if (Array.isArray(arr)) {
              nextBlocks[def.key] = arr
                .filter(
                  (item): item is BmcStickyCard =>
                    Boolean(item) &&
                    typeof item.id === "string" &&
                    typeof item.text === "string",
                )
                .map((item) => ({ id: item.id, text: item.text }));
            }
          }
        }
        setStudio({
          pitch: {
            ...empty.pitch,
            ...(parsed.pitch ?? {}),
          },
          blocks: nextBlocks,
        });
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore corrupted localStorage or private browsing mode
    } finally {
      setHydrated(true);
    }
  }, [studioStorageKey]);

  // Persist studio state to localStorage on every update
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(studioStorageKey, JSON.stringify(studio));
      setLastSavedAt(new Date());
    } catch {
      // Quota or private mode — fail silently (R2)
    }
  }, [studio, hydrated, studioStorageKey]);

  // Clear localStorage draft and refresh route on successful submission
  useEffect(() => {
    if (state.ok) {
      captureEvent(ANALYTICS_EVENTS.eg_deliverable_submitted, {
        deliverableTemplateId,
        version,
      });
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(studioStorageKey);
        } catch {
          // Ignore storage errors
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, studioStorageKey, router]);

  const completedBlocksCount = useMemo(() => {
    let count = 0;
    for (const def of BMC_BLOCKS) {
      const hasValidCard = (studio.blocks[def.key] ?? []).some(
        (c) => c.text.trim().length > 0,
      );
      const hasPendingInput = (draftInputs[def.key] ?? "").trim().length > 0;
      if (hasValidCard || hasPendingInput) {
        count += 1;
      }
    }
    return count;
  }, [studio.blocks, draftInputs]);

  // Include any un-added draft text in the serialized output so nothing typed is lost on submit
  const effectiveStudioState = useMemo<BmcStudioState>(() => {
    const mergedBlocks: Record<BmcBlockKey, BmcStickyCard[]> = {
      ...studio.blocks,
    };
    for (const def of BMC_BLOCKS) {
      const pendingText = (draftInputs[def.key] ?? "").trim();
      if (pendingText.length > 0) {
        mergedBlocks[def.key] = [
          ...(mergedBlocks[def.key] ?? []),
          { id: `pending_${def.key}`, text: pendingText },
        ];
      }
    }
    return {
      pitch: studio.pitch,
      blocks: mergedBlocks,
    };
  }, [studio, draftInputs]);

  const serializedMarkdown = useMemo(
    () => serializeBmcToMarkdown(deliverableTitle, effectiveStudioState),
    [deliverableTitle, effectiveStudioState],
  );

  function updatePitchField<K extends keyof ValuePropositionPitch>(
    field: K,
    value: ValuePropositionPitch[K],
  ) {
    setStudio((prev) => ({
      ...prev,
      pitch: {
        ...prev.pitch,
        [field]: value,
      },
    }));
  }

  function addCard(blockKey: BmcBlockKey) {
    const text = (draftInputs[blockKey] ?? "").trim();
    if (!text) return;
    setStudio((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockKey]: [
          ...(prev.blocks[blockKey] ?? []),
          { id: makeCardId(blockKey), text },
        ],
      },
    }));
    setDraftInputs((prev) => ({ ...prev, [blockKey]: "" }));
  }

  function updateCardText(blockKey: BmcBlockKey, cardId: string, text: string) {
    setStudio((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockKey]: (prev.blocks[blockKey] ?? []).map((card) =>
          card.id === cardId ? { ...card, text } : card,
        ),
      },
    }));
  }

  function removeCard(blockKey: BmcBlockKey, cardId: string) {
    setStudio((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockKey]: (prev.blocks[blockKey] ?? []).filter(
          (card) => card.id !== cardId,
        ),
      },
    }));
  }

  const submitLabel =
    version === 2 ? t.submission_v2_submit : t.submission_submit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
          borderRadius: 12,
        }}
      >
        <div
          role="tablist"
          aria-label="Mode de saisie du livrable Business Model Canvas"
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "studio"}
            onClick={() => setMode("studio")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              border:
                mode === "studio" ? "2px solid #0f172a" : "1px solid #cbd5e1",
              background: mode === "studio" ? "#0f172a" : "#ffffff",
              color: mode === "studio" ? "#ffffff" : "#334155",
            }}
          >
            Canevas interactif 9 blocs (recommandé)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "classic"}
            onClick={() => setMode("classic")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border:
                mode === "classic" ? "2px solid #0f172a" : "1px solid #cbd5e1",
              background: mode === "classic" ? "#0f172a" : "#ffffff",
              color: mode === "classic" ? "#ffffff" : "#334155",
            }}
          >
            Lien externe / Texte libre
          </button>
        </div>

        {mode === "studio" ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: completedBlocksCount === 9 ? "#dcfce7" : "#fef3c7",
              color: completedBlocksCount === 9 ? "#166534" : "#92400e",
              border:
                completedBlocksCount === 9
                  ? "1px solid #86efac"
                  : "1px solid #fde68a",
            }}
          >
            <span>
              {completedBlocksCount === 9 ? "✓" : "⚡"} {completedBlocksCount} / 9
              blocs complétés
            </span>
          </div>
        ) : null}
      </div>

      {mode === "classic" ? (
        <SubmissionForm
          deliverableTemplateId={deliverableTemplateId}
          playerId={playerId}
          version={version}
        />
      ) : (
        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <input
            type="hidden"
            name="deliverableTemplateId"
            value={deliverableTemplateId}
          />
          <input type="hidden" name="kind" value="proof_text" />
          <input type="hidden" name="proofText" value={serializedMarkdown} />

          {/* Top Banner: Proposition de Valeur & Place dans la Chaîne de Valeur */}
          <section
            aria-label="Proposition de valeur et place dans la chaîne de valeur"
            style={{
              border: "2px solid #f59e0b",
              borderRadius: 14,
              background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              padding: 18,
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
                gap: 8,
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#b45309",
                    color: "#ffffff",
                    marginBottom: 4,
                  }}
                >
                  Boussole Stratégique
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#78350f",
                  }}
                >
                  Proposition de Valeur & Place dans la Chaîne de Valeur
                </h3>
              </div>
              <span style={{ fontSize: 12, color: "#92400e" }}>
                Formulez votre promesse client avant de détailler les 9 blocs
              </span>
            </div>

            {/* Structured Pitch Sentence Builder */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #fcd34d",
                borderRadius: 10,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Pour [cible]
                </span>
                <input
                  type="text"
                  value={studio.pitch.cible}
                  onChange={(e) => updatePitchField("cible", e.target.value)}
                  placeholder="Ex: les jeunes actifs urbains pressés"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Notre offre [nom]
                </span>
                <input
                  type="text"
                  value={studio.pitch.nomOffre}
                  onChange={(e) => updatePitchField("nomOffre", e.target.value)}
                  placeholder="Ex: FreshBox Maroc"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Est [catégorie]
                </span>
                <input
                  type="text"
                  value={studio.pitch.categorie}
                  onChange={(e) =>
                    updatePitchField("categorie", e.target.value)
                  }
                  placeholder="Ex: un service d'abonnement repas local"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Qui apporte [bénéfice clé]
                </span>
                <input
                  type="text"
                  value={studio.pitch.beneficeCle}
                  onChange={(e) =>
                    updatePitchField("beneficeCle", e.target.value)
                  }
                  placeholder="Ex: des repas équilibrés prêts en 10 min"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Contrairement à [alternative]
                </span>
                <input
                  type="text"
                  value={studio.pitch.alternative}
                  onChange={(e) =>
                    updatePitchField("alternative", e.target.value)
                  }
                  placeholder="Ex: la livraison fast-food coûteuse"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Grâce à [différenciation]
                </span>
                <input
                  type="text"
                  value={studio.pitch.differenciation}
                  onChange={(e) =>
                    updatePitchField("differenciation", e.target.value)
                  }
                  placeholder="Ex: des ingrédients pré-dosés en circuit court"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </label>
            </div>

            {/* Live Pitch Preview + Value Chain Position */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px dashed #d97706",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#451a03",
                }}
              >
                <strong>Phrase de synthèse : </strong>
                Pour{" "}
                <span style={{ textDecoration: "underline", fontWeight: 700 }}>
                  {studio.pitch.cible.trim() || "[cible]"}
                </span>
                , notre offre{" "}
                <span style={{ textDecoration: "underline", fontWeight: 700 }}>
                  {studio.pitch.nomOffre.trim() || "[nom]"}
                </span>{" "}
                est{" "}
                <span style={{ textDecoration: "underline", fontWeight: 700 }}>
                  {studio.pitch.categorie.trim() || "[catégorie]"}
                </span>{" "}
                qui apporte{" "}
                <span style={{ textDecoration: "underline", fontWeight: 700 }}>
                  {studio.pitch.beneficeCle.trim() || "[bénéfice clé]"}
                </span>{" "}
                contrairement à{" "}
                <span style={{ textDecoration: "underline", fontWeight: 700 }}>
                  {studio.pitch.alternative.trim() || "[alternative]"}
                </span>{" "}
                grâce à{" "}
                <span style={{ textDecoration: "underline", fontWeight: 700 }}>
                  {studio.pitch.differenciation.trim() || "[différenciation]"}
                </span>
                .
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #fcd34d",
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                >
                  Place dans la chaîne de valeur
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {VALUE_CHAIN_OPTIONS.map((option) => {
                    const active = studio.pitch.placeChaineDeValeur === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          updatePitchField("placeChaineDeValeur", option)
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          border: active
                            ? "1.5px solid #b45309"
                            : "1px solid #cbd5e1",
                          background: active ? "#fef3c7" : "#f8fafc",
                          color: active ? "#78350f" : "#334155",
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={studio.pitch.detailChaineDeValeur}
                  onChange={(e) =>
                    updatePitchField("detailChaineDeValeur", e.target.value)
                  }
                  placeholder="Précision sur votre rôle dans la chaîne (ex: en amont avec les producteurs, en aval avec les distributeurs...)"
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                  }}
                />
              </div>
            </div>
          </section>

          {/* Color Legend for the 4 BMC Macro-Zones */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              fontSize: 12,
              color: "#475569",
            }}
          >
            <span style={{ fontWeight: 700 }}>Légende du Canevas :</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "#334155",
                }}
              />
              Infrastructure & faisabilité (Blocs 1, 2, 3)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "#b45309",
                }}
              />
              Proposition de valeur (Bloc 4 — Centre)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "#047857",
                }}
              />
              Marché & désirabilité client (Blocs 5, 6, 7)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: "#4338ca",
                }}
              />
              Viabilité financière (Blocs 8, 9)
            </span>
          </div>

          {/* Responsive CSS Grid matching the classic Osterwalder 9-Block BMC Poster */}
          <style>{`
            .eg-bmc-poster-grid {
              display: grid;
              gap: 12px;
              grid-template-columns: 1fr;
            }
            @media (min-width: 960px) {
              .eg-bmc-poster-grid {
                grid-template-columns: repeat(10, minmax(0, 1fr));
                grid-template-rows: minmax(210px, auto) minmax(210px, auto) minmax(190px, auto);
                grid-template-areas:
                  "kp kp ka ka vp vp cr cr cs cs"
                  "kp kp kr kr vp vp ch ch cs cs"
                  "cost cost cost cost cost rev rev rev rev rev";
              }
              .eg-bmc-area-kp { grid-area: kp; }
              .eg-bmc-area-ka { grid-area: ka; }
              .eg-bmc-area-kr { grid-area: kr; }
              .eg-bmc-area-vp { grid-area: vp; }
              .eg-bmc-area-cr { grid-area: cr; }
              .eg-bmc-area-ch { grid-area: ch; }
              .eg-bmc-area-cs { grid-area: cs; }
              .eg-bmc-area-cost { grid-area: cost; }
              .eg-bmc-area-rev { grid-area: rev; }
            }
          `}</style>

          <div className="eg-bmc-poster-grid">
            {BMC_BLOCKS.map((block) => {
              const palette = THEME_STYLES[block.theme];
              const cards = studio.blocks[block.key] ?? [];
              const draftText = draftInputs[block.key] ?? "";

              return (
                <section
                  key={block.key}
                  aria-label={`${block.number} ${block.title}`}
                  className={`eg-bmc-area-${block.gridArea}`}
                  style={{
                    border: `2px solid ${palette.border}`,
                    borderRadius: 12,
                    background: palette.bg,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    overflow: "hidden",
                  }}
                >
                  {/* Block Header */}
                  <div>
                    <div
                      style={{
                        background: palette.headerBg,
                        padding: "10px 12px",
                        borderBottom: `1px solid ${palette.border}`,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: palette.badgeBg,
                              color: palette.badgeText,
                            }}
                          >
                            {block.number}
                          </span>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 800,
                              color: palette.accentText,
                            }}
                          >
                            {block.title}
                          </h4>
                        </div>
                        <p
                          style={{
                            margin: "3px 0 0 0",
                            fontSize: 11,
                            color: "#475569",
                          }}
                        >
                          {block.subtitle}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: palette.accentText,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cards.length} {cards.length > 1 ? "notes" : "note"}
                      </span>
                    </div>

                    {/* Sticky Cards List */}
                    <div
                      style={{
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {cards.length === 0 ? (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontStyle: "italic",
                            color: "#64748b",
                            padding: "6px 4px",
                          }}
                        >
                          Aucune note pour le moment. Ajoutez vos idées ci-dessous.
                        </p>
                      ) : (
                        cards.map((card) => (
                          <div
                            key={card.id}
                            style={{
                              background: palette.stickyBg,
                              border: `1px solid ${palette.stickyBorder}`,
                              borderRadius: 8,
                              padding: "6px 8px",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 6,
                              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
                            }}
                          >
                            <textarea
                              rows={2}
                              value={card.text}
                              aria-label={`Note ${block.title}`}
                              onChange={(e) =>
                                updateCardText(
                                  block.key,
                                  card.id,
                                  e.target.value,
                                )
                              }
                              style={{
                                flex: 1,
                                border: "none",
                                background: "transparent",
                                fontSize: 12,
                                lineHeight: 1.4,
                                color: "#0f172a",
                                resize: "vertical",
                                padding: 0,
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeCard(block.key, card.id)}
                              aria-label={`Supprimer cette note de ${block.title}`}
                              title="Supprimer cette note"
                              style={{
                                border: "none",
                                background: "#fee2e2",
                                color: "#991b1b",
                                borderRadius: 6,
                                width: 22,
                                height: 22,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                lineHeight: 1,
                                flexShrink: 0,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Sticky-Note Input Footer */}
                  <div
                    style={{
                      padding: "8px 10px 10px 10px",
                      borderTop: `1px dashed ${palette.stickyBorder}`,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <input
                      type="text"
                      value={draftText}
                      aria-label={`Nouvelle note pour ${block.title}`}
                      placeholder={block.placeholder}
                      onChange={(e) =>
                        setDraftInputs((prev) => ({
                          ...prev,
                          [block.key]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCard(block.key);
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "6px 8px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addCard(block.key)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: palette.badgeBg,
                        color: palette.badgeText,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      + Ajouter
                    </button>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Pedagogical warn-only guidance & submission footer */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <AutoSaveBadge lastSavedAt={lastSavedAt} />
              {completedBlocksCount < 9 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#92400e",
                  }}
                >
                  Conseil pédagogique : {9 - completedBlocksCount} bloc(s) sur 9
                  sont encore vides. Vous pouvez soumettre dès maintenant ou
                  continuer à enrichir votre canevas.
                </p>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#166534",
                  }}
                >
                  Les 9 blocs de votre Business Model Canvas contiennent au
                  moins une hypothèse.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="eic-button--submit"
            >
              {pending ? t.submission_submitting : submitLabel}
            </button>
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
