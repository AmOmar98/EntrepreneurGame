"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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

export type GtmChannelType =
  | "organique"
  | "partenariat_b2b2c"
  | "prospection_directe"
  | "payant";

export type GtmChannelPriority = "principale" | "secondaire";

export type GtmChannelCard = {
  id: string;
  canal: string;
  type: GtmChannelType;
  actionConcrete: string;
  coutEstime: string;
  volumeVise: string;
  priorite: GtmChannelPriority;
};

type GtmStudioDraft = {
  premiersClientsCibles: string;
  offrePilote: string;
  promesseDifferenciante: string;
  tarifPiloteTest: string;
  channels: GtmChannelCard[];
  indicateurAcquisition: string;
  indicateurActivation: string;
  indicateurConversion: string;
  objectif30Jours: string;
};

const CHANNEL_TYPE_LABELS: Record<
  GtmChannelType,
  { label: string; bg: string; border: string; color: string }
> = {
  prospection_directe: {
    label: "Prospection directe",
    bg: "#eff6ff",
    border: "#93c5fd",
    color: "#1d4ed8",
  },
  partenariat_b2b2c: {
    label: "Partenariat B2B2C / Prescripteur",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    color: "#6d28d9",
  },
  organique: {
    label: "Organique / Communauté",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    color: "#047857",
  },
  payant: {
    label: "Acquisition payante (Ads)",
    bg: "#fff7ed",
    border: "#fdba74",
    color: "#c2410c",
  },
};

const PRICING_PRESETS = [
  "Abonnement mensuel / annuel (SaaS)",
  "Commission sur transaction",
  "Tarif unitaire / pack pilote",
  "Freemium + options premium",
  "Licence B2B / institutionnelle",
];

function createDefaultDraft(): GtmStudioDraft {
  return {
    premiersClientsCibles: "",
    offrePilote: "",
    promesseDifferenciante: "",
    tarifPiloteTest: "",
    channels: [
      {
        id: "ch-1",
        canal: "",
        type: "prospection_directe",
        actionConcrete: "",
        coutEstime: "",
        volumeVise: "",
        priorite: "principale",
      },
      {
        id: "ch-2",
        canal: "",
        type: "partenariat_b2b2c",
        actionConcrete: "",
        coutEstime: "",
        volumeVise: "",
        priorite: "secondaire",
      },
    ],
    indicateurAcquisition: "",
    indicateurActivation: "",
    indicateurConversion: "",
    objectif30Jours: "",
  };
}

function serializeGtmToMarkdown(
  title: string,
  draft: GtmStudioDraft,
): string {
  const lines: string[] = [];
  const hasCadrage =
    draft.premiersClientsCibles.trim().length > 0 ||
    draft.offrePilote.trim().length > 0 ||
    draft.promesseDifferenciante.trim().length > 0 ||
    draft.tarifPiloteTest.trim().length > 0;

  const filledChannels = draft.channels.filter(
    (c) =>
      c.canal.trim().length > 0 ||
      c.actionConcrete.trim().length > 0 ||
      c.coutEstime.trim().length > 0 ||
      c.volumeVise.trim().length > 0,
  );

  const hasFunnel =
    draft.indicateurAcquisition.trim().length > 0 ||
    draft.indicateurActivation.trim().length > 0 ||
    draft.indicateurConversion.trim().length > 0 ||
    draft.objectif30Jours.trim().length > 0;

  if (!hasCadrage && filledChannels.length === 0 && !hasFunnel) {
    return "";
  }

  lines.push(`# ${title}`);
  lines.push("");

  lines.push("## 1. Cadrage du Lancement & Offre Pilote");
  lines.push(
    `- **Premiers clients cibles (10–50 premiers adoptants)** : ${
      draft.premiersClientsCibles.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Périmètre de l'offre pilote** : ${
      draft.offrePilote.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Promesse différenciante** : ${
      draft.promesseDifferenciante.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Modèle de prix & tarif pilote testé** : ${
      draft.tarifPiloteTest.trim() || "_Non renseigné_"
    }`,
  );
  lines.push("");

  lines.push("## 2. Mix des Canaux d'Acquisition");
  if (filledChannels.length === 0) {
    lines.push("_Aucun canal d'acquisition renseigné._");
  } else {
    filledChannels.forEach((ch, idx) => {
      const typeLabel = CHANNEL_TYPE_LABELS[ch.type]?.label ?? ch.type;
      const prioLabel =
        ch.priorite === "principale"
          ? "Priorité principale"
          : "Canal secondaire";
      lines.push(
        `### Canal ${idx + 1} : ${ch.canal.trim() || "Canal à préciser"} (${typeLabel} — ${prioLabel})`,
      );
      if (ch.actionConcrete.trim()) {
        lines.push(`- **Action concrète** : ${ch.actionConcrete.trim()}`);
      }
      if (ch.coutEstime.trim()) {
        lines.push(`- **Coût / effort estimé** : ${ch.coutEstime.trim()}`);
      }
      if (ch.volumeVise.trim()) {
        lines.push(`- **Volume visé** : ${ch.volumeVise.trim()}`);
      }
      lines.push("");
    });
  }

  lines.push("## 3. Validation Commerciale & Indicateurs de Déploiement (Funnel KPIs)");
  lines.push(
    `- **Acquisition (Haut d'entonnoir)** : ${
      draft.indicateurAcquisition.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Activation (Essais / Démos / RDV)** : ${
      draft.indicateurActivation.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Conversion (Premières ventes / LOI / Précommandes)** : ${
      draft.indicateurConversion.trim() || "_Non renseigné_"
    }`,
  );
  lines.push(
    `- **Objectif de validation à 30 jours** : ${
      draft.objectif30Jours.trim() || "_Non renseigné_"
    }`,
  );

  return lines.join("\n").trim();
}

export function GtmStrategyComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "external">("studio");
  const [draft, setDraft] = useState<GtmStudioDraft>(createDefaultDraft);
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
        const parsed = JSON.parse(raw) as Partial<GtmStudioDraft>;
        setDraft((prev) => ({
          premiersClientsCibles:
            typeof parsed.premiersClientsCibles === "string"
              ? parsed.premiersClientsCibles
              : prev.premiersClientsCibles,
          offrePilote:
            typeof parsed.offrePilote === "string"
              ? parsed.offrePilote
              : prev.offrePilote,
          promesseDifferenciante:
            typeof parsed.promesseDifferenciante === "string"
              ? parsed.promesseDifferenciante
              : prev.promesseDifferenciante,
          tarifPiloteTest:
            typeof parsed.tarifPiloteTest === "string"
              ? parsed.tarifPiloteTest
              : prev.tarifPiloteTest,
          channels:
            Array.isArray(parsed.channels) && parsed.channels.length > 0
              ? parsed.channels.map((ch, i) => ({
                  id: typeof ch.id === "string" ? ch.id : `ch-${i + 1}`,
                  canal: typeof ch.canal === "string" ? ch.canal : "",
                  type:
                    ch.type === "organique" ||
                    ch.type === "partenariat_b2b2c" ||
                    ch.type === "prospection_directe" ||
                    ch.type === "payant"
                      ? ch.type
                      : "prospection_directe",
                  actionConcrete:
                    typeof ch.actionConcrete === "string"
                      ? ch.actionConcrete
                      : "",
                  coutEstime:
                    typeof ch.coutEstime === "string" ? ch.coutEstime : "",
                  volumeVise:
                    typeof ch.volumeVise === "string" ? ch.volumeVise : "",
                  priorite:
                    ch.priorite === "principale" || ch.priorite === "secondaire"
                      ? ch.priorite
                      : "principale",
                }))
              : prev.channels,
          indicateurAcquisition:
            typeof parsed.indicateurAcquisition === "string"
              ? parsed.indicateurAcquisition
              : prev.indicateurAcquisition,
          indicateurActivation:
            typeof parsed.indicateurActivation === "string"
              ? parsed.indicateurActivation
              : prev.indicateurActivation,
          indicateurConversion:
            typeof parsed.indicateurConversion === "string"
              ? parsed.indicateurConversion
              : prev.indicateurConversion,
          objectif30Jours:
            typeof parsed.objectif30Jours === "string"
              ? parsed.objectif30Jours
              : prev.objectif30Jours,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore corrupted JSON or storage errors
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Auto-save studio state to localStorage on change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage quota errors
    }
  }, [draft, hydrated, storageKey]);

  // On successful submission: analytics + clear draft + refresh
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

  const serializedMarkdown = useMemo(
    () => serializeGtmToMarkdown(deliverableTitle, draft),
    [deliverableTitle, draft],
  );

  // Pedagogical warn-only section completion counter (R2 preserved: never blocks submit)
  const sectionStatus = useMemo(() => {
    const s1 =
      draft.premiersClientsCibles.trim().length > 0 &&
      draft.offrePilote.trim().length > 0;
    const s2 = draft.channels.some(
      (c) => c.canal.trim().length > 0 && c.actionConcrete.trim().length > 0,
    );
    const s3 =
      draft.indicateurAcquisition.trim().length > 0 ||
      draft.indicateurConversion.trim().length > 0 ||
      draft.objectif30Jours.trim().length > 0;
    const count = [s1, s2, s3].filter(Boolean).length;
    return { s1, s2, s3, count, total: 3 };
  }, [draft]);

  function updateField<K extends keyof GtmStudioDraft>(
    key: K,
    value: GtmStudioDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateChannel(id: string, patch: Partial<GtmChannelCard>) {
    setDraft((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) =>
        ch.id === id ? { ...ch, ...patch } : ch,
      ),
    }));
  }

  function addChannel() {
    setDraft((prev) => ({
      ...prev,
      channels: [
        ...prev.channels,
        {
          id: `ch-${Date.now()}-${prev.channels.length + 1}`,
          canal: "",
          type: "organique",
          actionConcrete: "",
          coutEstime: "",
          volumeVise: "",
          priorite: "secondaire",
        },
      ],
    }));
  }

  function removeChannel(id: string) {
    setDraft((prev) => {
      if (prev.channels.length <= 1) return prev;
      return {
        ...prev,
        channels: prev.channels.filter((ch) => ch.id !== id),
      };
    });
  }

  function moveChannel(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.channels.length) return prev;
      const next = [...prev.channels];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return { ...prev, channels: next };
    });
  }

  const submitLabel =
    version === 2 ? t.submission_v2_submit : t.submission_submit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
      {/* Mode Switcher Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
        }}
      >
        <div
          role="tablist"
          aria-label="Mode de saisie du livrable"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "studio"}
            onClick={() => setMode("studio")}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border:
                mode === "studio" ? "1px solid #1B3A5C" : "1px solid #cbd5e1",
              background: mode === "studio" ? "#1B3A5C" : "#ffffff",
              color: mode === "studio" ? "#ffffff" : "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
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
              border:
                mode === "external" ? "1px solid #1B3A5C" : "1px solid #cbd5e1",
              background: mode === "external" ? "#1B3A5C" : "#ffffff",
              color: mode === "external" ? "#ffffff" : "#334155",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Lien externe / Texte libre
          </button>
        </div>

        {mode === "studio" ? (
          <span
            role="status"
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
              background:
                sectionStatus.count === sectionStatus.total
                  ? "#dcfce7"
                  : "#fef3c7",
              color:
                sectionStatus.count === sectionStatus.total
                  ? "#166534"
                  : "#92400e",
              border:
                sectionStatus.count === sectionStatus.total
                  ? "1px solid #86efac"
                  : "1px solid #fcd34d",
            }}
          >
            {sectionStatus.count} / {sectionStatus.total} volets GTM renseignés
          </span>
        ) : null}
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
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <input
            type="hidden"
            name="deliverableTemplateId"
            value={deliverableTemplateId}
          />
          <input type="hidden" name="kind" value="proof_text" />
          <input type="hidden" name="proofText" value={serializedMarkdown} />

          {/* Section 1: Cadrage du Lancement & Offre Pilote */}
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 18,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#0284c7",
                  }}
                >
                  Volet 1 · Cadrage Go-to-Market
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  1. Cadrage du Lancement & Offre Pilote
                </h3>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: sectionStatus.s1 ? "#15803d" : "#64748b",
                  fontWeight: 500,
                }}
              >
                {sectionStatus.s1 ? "✓ Renseigné" : "Conseillé"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              <label
                className="eic-form-field"
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span
                  className="eic-form-field__label"
                  style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                >
                  Premiers clients cibles (10 à 50 premiers adoptants)
                </span>
                <textarea
                  rows={3}
                  value={draft.premiersClientsCibles}
                  onChange={(e) =>
                    updateField("premiersClientsCibles", e.target.value)
                  }
                  placeholder="Ex : 20 cabinets médicaux privés à Fès-Meknès ayant un flux > 30 patients/jour..."
                  className="eic-form-textarea"
                />
              </label>

              <label
                className="eic-form-field"
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span
                  className="eic-form-field__label"
                  style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                >
                  Périmètre de l&apos;offre pilote (MVP commercialisable)
                </span>
                <textarea
                  rows={3}
                  value={draft.offrePilote}
                  onChange={(e) => updateField("offrePilote", e.target.value)}
                  placeholder="Ex : Essai pilote de 4 semaines incluant l'installation, le suivi hebdomadaire et 1 fonctionnalité cœur..."
                  className="eic-form-textarea"
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              <label
                className="eic-form-field"
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span
                  className="eic-form-field__label"
                  style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                >
                  Promesse différenciante au lancement
                </span>
                <input
                  type="text"
                  value={draft.promesseDifferenciante}
                  onChange={(e) =>
                    updateField("promesseDifferenciante", e.target.value)
                  }
                  placeholder="Ex : Diviser par 2 le temps de gestion administrative dès la 1ère semaine"
                  className="eic-form-input"
                />
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  className="eic-form-field"
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <span
                    className="eic-form-field__label"
                    style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                  >
                    Modèle de prix & tarif pilote testé
                  </span>
                  <input
                    type="text"
                    value={draft.tarifPiloteTest}
                    onChange={(e) =>
                      updateField("tarifPiloteTest", e.target.value)
                    }
                    placeholder="Ex : Abonnement pilote à 290 MAD/mois ou pack lancement 1 500 MAD..."
                    className="eic-form-input"
                  />
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRICING_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        updateField(
                          "tarifPiloteTest",
                          draft.tarifPiloteTest.trim().length > 0
                            ? `${draft.tarifPiloteTest.trim()} · ${preset}`
                            : `${preset} : `,
                        )
                      }
                      style={{
                        padding: "3px 8px",
                        fontSize: 11,
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Mix des Canaux d'Acquisition (Interactive Channel Cards) */}
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 18,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#7c3aed",
                  }}
                >
                  Volet 2 · Acquisition & Distribution
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  2. Mix des Canaux d&apos;Acquisition
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Sélectionnez vos canaux prioritaires, précisez l&apos;action terrain concrète et ordonnez-les par importance.
                </p>
              </div>
              <button
                type="button"
                onClick={addChannel}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid #1B3A5C",
                  background: "#f0f9ff",
                  color: "#1B3A5C",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Ajouter un canal
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {draft.channels.map((ch, idx) => {
                const badge = CHANNEL_TYPE_LABELS[ch.type];
                const isMain = ch.priorite === "principale";
                return (
                  <div
                    key={ch.id}
                    style={{
                      border: isMain
                        ? "1px solid #93c5fd"
                        : "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 14,
                      background: isMain ? "#f8fafc" : "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          Canal #{idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateChannel(ch.id, {
                              priorite:
                                ch.priorite === "principale"
                                  ? "secondaire"
                                  : "principale",
                            })
                          }
                          style={{
                            padding: "2px 9px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 999,
                            cursor: "pointer",
                            border: isMain
                              ? "1px solid #f59e0b"
                              : "1px solid #cbd5e1",
                            background: isMain ? "#fef3c7" : "#f1f5f9",
                            color: isMain ? "#92400e" : "#475569",
                          }}
                        >
                          {isMain
                            ? "★ Priorité principale"
                            : "☆ Canal secondaire"}
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => moveChannel(idx, -1)}
                          disabled={idx === 0}
                          aria-label={`Monter le canal ${idx + 1}`}
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            cursor: idx === 0 ? "not-allowed" : "pointer",
                            opacity: idx === 0 ? 0.4 : 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveChannel(idx, 1)}
                          disabled={idx === draft.channels.length - 1}
                          aria-label={`Descendre le canal ${idx + 1}`}
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            cursor:
                              idx === draft.channels.length - 1
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              idx === draft.channels.length - 1 ? 0.4 : 1,
                          }}
                        >
                          ↓
                        </button>
                        {draft.channels.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeChannel(ch.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: 12,
                              borderRadius: 6,
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              cursor: "pointer",
                            }}
                          >
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
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
                          Nom du canal
                        </span>
                        <input
                          type="text"
                          value={ch.canal}
                          onChange={(e) =>
                            updateChannel(ch.id, { canal: e.target.value })
                          }
                          placeholder="Ex : LinkedIn Outbound, Associations étudiantes, Démarchage terrain..."
                          className="eic-form-input"
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
                          Famille de canal
                        </span>
                        <select
                          value={ch.type}
                          onChange={(e) =>
                            updateChannel(ch.id, {
                              type: e.target.value as GtmChannelType,
                            })
                          }
                          className="eic-form-input"
                        >
                          <option value="prospection_directe">
                            Prospection directe (Terrain / Cold outreach)
                          </option>
                          <option value="partenariat_b2b2c">
                            Partenariat B2B2C / Prescripteur
                          </option>
                          <option value="organique">
                            Organique / Réseaux sociaux / Contenu
                          </option>
                          <option value="payant">
                            Acquisition payante (Ads / Sponsoring)
                          </option>
                        </select>
                      </label>
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
                        Action concrète d&apos;exécution
                      </span>
                      <input
                        type="text"
                        value={ch.actionConcrete}
                        onChange={(e) =>
                          updateChannel(ch.id, {
                            actionConcrete: e.target.value,
                          })
                        }
                        placeholder="Ex : Visiter 15 commerces du quartier Atlas avec une démo sur tablette..."
                        className="eic-form-input"
                      />
                    </label>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
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
                          Coût ou budget estimé (CAC / temps)
                        </span>
                        <input
                          type="text"
                          value={ch.coutEstime}
                          onChange={(e) =>
                            updateChannel(ch.id, {
                              coutEstime: e.target.value,
                            })
                          }
                          placeholder="Ex : 0 MAD (temps équipe 4h/sem) ou 500 MAD..."
                          className="eic-form-input"
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
                          Volume visé sur ce canal
                        </span>
                        <input
                          type="text"
                          value={ch.volumeVise}
                          onChange={(e) =>
                            updateChannel(ch.id, {
                              volumeVise: e.target.value,
                            })
                          }
                          placeholder="Ex : 30 prospects contactés → 8 démos"
                          className="eic-form-input"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Validation Commerciale & Indicateurs de Déploiement (Funnel KPIs) */}
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 18,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#059669",
                  }}
                >
                  Volet 3 · Entonnoir Commercial & KPIs
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  3. Validation Commerciale & Indicateurs de Déploiement
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Définissez vos indicateurs mesurables pour suivre la traction du pilote.
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: sectionStatus.s3 ? "#15803d" : "#64748b",
                  fontWeight: 500,
                }}
              >
                {sectionStatus.s3 ? "✓ Renseigné" : "Conseillé"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  border: "1px solid #bae6fd",
                  borderRadius: 10,
                  padding: 12,
                  background: "#f0f9ff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0369a1",
                    textTransform: "uppercase",
                  }}
                >
                  1. Acquisition (Leads)
                </span>
                <input
                  type="text"
                  value={draft.indicateurAcquisition}
                  onChange={(e) =>
                    updateField("indicateurAcquisition", e.target.value)
                  }
                  placeholder="Ex : 25 prospects qualifiés / semaine"
                  className="eic-form-input"
                />
              </div>

              <div
                style={{
                  border: "1px solid #ddd6fe",
                  borderRadius: 10,
                  padding: 12,
                  background: "#f5f3ff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6d28d9",
                    textTransform: "uppercase",
                  }}
                >
                  2. Activation (Essais / Démos)
                </span>
                <input
                  type="text"
                  value={draft.indicateurActivation}
                  onChange={(e) =>
                    updateField("indicateurActivation", e.target.value)
                  }
                  placeholder="Ex : 10 démonstrations ou comptes actifs"
                  className="eic-form-input"
                />
              </div>

              <div
                style={{
                  border: "1px solid #a7f3d0",
                  borderRadius: 10,
                  padding: 12,
                  background: "#ecfdf5",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#047857",
                    textTransform: "uppercase",
                  }}
                >
                  3. Conversion (Ventes / LOI)
                </span>
                <input
                  type="text"
                  value={draft.indicateurConversion}
                  onChange={(e) =>
                    updateField("indicateurConversion", e.target.value)
                  }
                  placeholder="Ex : 5 clients pilotes payants ou LOI signées"
                  className="eic-form-input"
                />
              </div>
            </div>

            <label
              className="eic-form-field"
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span
                className="eic-form-field__label"
                style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}
              >
                Objectif de validation commerciale à 30 jours (Critère Go / Pivot)
              </span>
              <textarea
                rows={2}
                value={draft.objectif30Jours}
                onChange={(e) => updateField("objectif30Jours", e.target.value)}
                placeholder="Ex : Obtenir 5 engagements pilotes fermes et un taux de rétention > 60 % après 4 semaines d'usage..."
                className="eic-form-textarea"
              />
            </label>
          </section>

          {/* Collapsible Markdown Preview */}
          <details
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "10px 14px",
              background: "#f8fafc",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#1B3A5C",
              }}
            >
              Aperçu du livrable structuré transmis au Mentor
            </summary>
            <pre
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 8,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                color: "#334155",
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {serializedMarkdown ||
                "Remplissez au moins un champ de l'atelier pour générer l'aperçu."}
            </pre>
          </details>

          <button
            type="submit"
            disabled={pending || serializedMarkdown.trim().length === 0}
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
