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

export type InteractiveDeliverableComposerProps = {
  deliverableTemplateId: string;
  deliverableSlug: string;
  deliverableTitle: string;
  playerId?: string | null;
  version?: 1 | 2;
  initialProofText?: string | null;
  initialProofUrl?: string | null;
};

export type FundingFamilyOption = {
  id: string;
  label: string;
  subtitle: string;
  tag: string;
};

export const FUNDING_FAMILIES: FundingFamilyOption[] = [
  {
    id: "bourse-subvention",
    label: "Bourse / Subvention pré-amorçage (Innov Idea / Tamwilcom)",
    subtitle: "Financement non dilutif pour valider la preuve de concept et le prototypage.",
    tag: "Non dilutif",
  },
  {
    id: "pret-honneur",
    label: "Prêt d'honneur (Innov Start)",
    subtitle: "Prêt à taux zéro sans garantie personnelle pour amorcer le lancement.",
    tag: "Taux 0%",
  },
  {
    id: "fonds-propres",
    label: "Fonds propres / Love Money",
    subtitle: "Apports des fondateurs et proches pour constituer la mise initiale.",
    tag: "Fondateurs",
  },
  {
    id: "incubation-concours",
    label: "Incubation / Concours & Prix",
    subtitle: "Dotations financières, hébergement, mentorat et visibilité écosystème.",
    tag: "Accompagnement",
  },
  {
    id: "dette-bancaire",
    label: "Dette bancaire / Leasing (Bank of Africa)",
    subtitle: "Financement d'équipements, matériel ou besoin en fonds de roulement.",
    tag: "Bancaire",
  },
  {
    id: "business-angels",
    label: "Business Angels / Seed",
    subtitle: "Ouverture du capital à des investisseurs pour accélérer la croissance.",
    tag: "Dilutif / Capital",
  },
];

export type BudgetPoste =
  | "R&D / Prototype"
  | "Marketing & Acquisition"
  | "Équipement / Infra"
  | "Juridique / Propriété Intellectuelle"
  | "Opérations / Trésorerie";

export const BUDGET_POSTES: {
  poste: BudgetPoste;
  color: string;
  bgSoft: string;
}[] = [
  {
    poste: "R&D / Prototype",
    color: "#1d4ed8",
    bgSoft: "#dbeafe",
  },
  {
    poste: "Marketing & Acquisition",
    color: "#0f766e",
    bgSoft: "#ccfbf1",
  },
  {
    poste: "Équipement / Infra",
    color: "#7c3aed",
    bgSoft: "#ede9fe",
  },
  {
    poste: "Juridique / Propriété Intellectuelle",
    color: "#b45309",
    bgSoft: "#fef3c7",
  },
  {
    poste: "Opérations / Trésorerie",
    color: "#15803d",
    bgSoft: "#dcfce7",
  },
];

export type BudgetPriority = "essentiel" | "modulable";

export type BudgetLineItem = {
  id: string;
  poste: BudgetPoste;
  description: string;
  montantMad: number;
  priorite: BudgetPriority;
};

export type FundingMilestoneItem = {
  id: string;
  jalon: string;
  echeance: string;
  livrableAttendu: string;
  kpiValidation: string;
};

export type ChecklistReadiness = "Prêt" | "En cours" | "À préparer";

export type ApplicationChecklistItem = {
  id: string;
  element: string;
  statut: ChecklistReadiness;
  notes: string;
};

type FundingStudioDraftState = {
  stadeProjet: string;
  famillesSelectionnees: string[];
  montantTotalRechercheMad: string;
  conditionsAccesIdentifiees: string;
  lignesBudget: BudgetLineItem[];
  jalons: FundingMilestoneItem[];
  checklist: ApplicationChecklistItem[];
};

const PROJECT_STAGES = [
  "Idéation & Validation du problème",
  "Prototype / MVP en construction",
  "MVP testé / Premiers utilisateurs",
  "Premiers revenus / Amorçage commercial",
];

const DEFAULT_CHECKLIST_ELEMENTS = [
  "Pitch Deck",
  "BMC",
  "Devis fournisseurs / chiffrage",
  "CV & complémentarité équipe",
  "Statut juridique / projection",
  "Étude de marché",
];

function createDefaultDraftState(): FundingStudioDraftState {
  return {
    stadeProjet: "Prototype / MVP en construction",
    famillesSelectionnees: [],
    montantTotalRechercheMad: "",
    conditionsAccesIdentifiees: "",
    lignesBudget: [
      {
        id: "budget-1",
        poste: "R&D / Prototype",
        description: "",
        montantMad: 0,
        priorite: "essentiel",
      },
      {
        id: "budget-2",
        poste: "Marketing & Acquisition",
        description: "",
        montantMad: 0,
        priorite: "essentiel",
      },
      {
        id: "budget-3",
        poste: "Opérations / Trésorerie",
        description: "",
        montantMad: 0,
        priorite: "modulable",
      },
    ],
    jalons: [
      {
        id: "jalon-1",
        jalon: "",
        echeance: "Mois 1 - Mois 3",
        livrableAttendu: "",
        kpiValidation: "",
      },
      {
        id: "jalon-2",
        jalon: "",
        echeance: "Mois 4 - Mois 6",
        livrableAttendu: "",
        kpiValidation: "",
      },
    ],
    checklist: DEFAULT_CHECKLIST_ELEMENTS.map((element, index) => ({
      id: `chk-${index + 1}`,
      element,
      statut: "À préparer" as ChecklistReadiness,
      notes: "",
    })),
  };
}

function formatMad(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 MAD";
  return `${Math.round(value).toLocaleString("fr-FR")} MAD`;
}

function serializeFundingNeedsMarkdown(
  title: string,
  draft: FundingStudioDraftState,
  totalBudgetMad: number,
  totalEssentielMad: number,
  totalModulableMad: number,
): string {
  const lines: string[] = [];
  lines.push(`# ${title || "Fiche de besoin de financement et première estimation financière"}`);
  lines.push("");

  // Section 1
  lines.push("## 1. Stade du Projet & Familles de Financement Ciblées");
  lines.push(`- **Stade actuel du projet :** ${draft.stadeProjet.trim() || "_Non renseigné_"}`);
  const montantRechercheNum = Number(draft.montantTotalRechercheMad);
  const montantRechercheLabel =
    draft.montantTotalRechercheMad.trim().length > 0 && Number.isFinite(montantRechercheNum)
      ? formatMad(montantRechercheNum)
      : draft.montantTotalRechercheMad.trim() || "_Non renseigné_";
  lines.push(`- **Montant total recherché :** ${montantRechercheLabel}`);

  if (draft.famillesSelectionnees.length > 0) {
    lines.push("- **Familles de financement ciblées :**");
    for (const label of draft.famillesSelectionnees) {
      lines.push(`  - ${label}`);
    }
  } else {
    lines.push("- **Familles de financement ciblées :** _Aucune famille sélectionnée_");
  }

  lines.push(
    `- **Conditions d'accès & critères d'éligibilité identifiés :**\n  ${
      draft.conditionsAccesIdentifiees.trim() || "_Non renseigné_"
    }`,
  );
  lines.push("");

  // Section 2
  lines.push("## 2. Simulateur de Budget & Utilisation des Fonds");
  lines.push(`- **Budget total estimé :** ${formatMad(totalBudgetMad)}`);
  lines.push(`- **Part essentielle (incompressible) :** ${formatMad(totalEssentielMad)}`);
  lines.push(`- **Part modulable (selon financement obtenu) :** ${formatMad(totalModulableMad)}`);
  lines.push("");

  const activeBudgetRows = draft.lignesBudget.filter(
    (row) => row.description.trim().length > 0 || row.montantMad > 0,
  );
  if (activeBudgetRows.length > 0) {
    lines.push("| Poste budgétaire | Description | Montant (MAD) | Priorité |");
    lines.push("| --- | --- | --- | --- |");
    for (const row of activeBudgetRows) {
      const desc = (row.description.trim() || "—").replace(/\|/g, "/");
      const prio = row.priorite === "essentiel" ? "Essentiel" : "Modulable";
      lines.push(`| ${row.poste} | ${desc} | ${formatMad(row.montantMad)} | ${prio} |`);
    }
    lines.push("");
    lines.push("### Répartition par catégorie");
    for (const cat of BUDGET_POSTES) {
      const catSum = draft.lignesBudget
        .filter((r) => r.poste === cat.poste)
        .reduce((acc, r) => acc + (Number.isFinite(r.montantMad) && r.montantMad > 0 ? r.montantMad : 0), 0);
      if (catSum > 0) {
        const pct = totalBudgetMad > 0 ? Math.round((catSum / totalBudgetMad) * 100) : 0;
        lines.push(`- **${cat.poste} :** ${formatMad(catSum)} (${pct}%)`);
      }
    }
  } else {
    lines.push("_Aucune ligne budgétaire détaillée._");
  }
  lines.push("");

  // Section 3
  lines.push("## 3. Jalons (Milestones) & Résultats Attendus");
  const activeMilestones = draft.jalons.filter(
    (j) =>
      j.jalon.trim().length > 0 ||
      j.livrableAttendu.trim().length > 0 ||
      j.kpiValidation.trim().length > 0,
  );
  if (activeMilestones.length > 0) {
    activeMilestones.forEach((m, idx) => {
      lines.push(
        `### Jalon ${idx + 1} : ${m.jalon.trim() || "À préciser"} (${m.echeance.trim() || "Échéance à définir"})`,
      );
      lines.push(`- **Livrable / résultat attendu :** ${m.livrableAttendu.trim() || "_Non renseigné_"}`);
      lines.push(`- **KPI de validation :** ${m.kpiValidation.trim() || "_Non renseigné_"}`);
    });
  } else {
    lines.push("_Aucun jalon renseigné._");
  }
  lines.push("");

  // Section 4
  lines.push("## 4. Checklist des Éléments à Réunir pour une Candidature");
  for (const item of draft.checklist) {
    const noteSuffix = item.notes.trim() ? ` — _Note : ${item.notes.trim()}_` : "";
    lines.push(`- **[${item.statut}]** ${item.element}${noteSuffix}`);
  }

  return lines.join("\n");
}

const initialState: WorkflowState = { ok: false, message: "" };

export function FundingNeedsComposer({
  deliverableTemplateId,
  deliverableTitle,
  playerId,
  version = 1,
  initialProofText,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "external">("studio");
  const [state, formAction, pending] = useActionState(submitDeliverable, initialState);
  const [draft, setDraft] = useState<FundingStudioDraftState>(() => createDefaultDraftState());
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  const studioStorageKey = useMemo(
    () => `${buildDraftStorageKey({ playerId, deliverableTemplateId, version })}_studio`,
    [playerId, deliverableTemplateId, version],
  );

  // Hydrate studio state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(studioStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FundingStudioDraftState>;
        setDraft((prev) => ({
          stadeProjet:
            typeof parsed.stadeProjet === "string" ? parsed.stadeProjet : prev.stadeProjet,
          famillesSelectionnees: Array.isArray(parsed.famillesSelectionnees)
            ? parsed.famillesSelectionnees.filter((x): x is string => typeof x === "string")
            : prev.famillesSelectionnees,
          montantTotalRechercheMad:
            typeof parsed.montantTotalRechercheMad === "string"
              ? parsed.montantTotalRechercheMad
              : prev.montantTotalRechercheMad,
          conditionsAccesIdentifiees:
            typeof parsed.conditionsAccesIdentifiees === "string"
              ? parsed.conditionsAccesIdentifiees
              : prev.conditionsAccesIdentifiees,
          lignesBudget:
            Array.isArray(parsed.lignesBudget) && parsed.lignesBudget.length > 0
              ? parsed.lignesBudget
              : prev.lignesBudget,
          jalons:
            Array.isArray(parsed.jalons) && parsed.jalons.length > 0
              ? parsed.jalons
              : prev.jalons,
          checklist:
            Array.isArray(parsed.checklist) && parsed.checklist.length > 0
              ? parsed.checklist
              : prev.checklist,
        }));
        setLastSavedAt(new Date());
      }
    } catch {
      // Ignore storage read errors in private browsing
    } finally {
      setHydrated(true);
    }
  }, [studioStorageKey]);

  // Persist studio state to localStorage on every change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(studioStorageKey, JSON.stringify(draft));
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage quota or private mode errors
    }
  }, [draft, hydrated, studioStorageKey]);

  // Handle successful submission
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
          // noop
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, studioStorageKey, router]);

  // Budget computations
  const { totalBudgetMad, totalEssentielMad, totalModulableMad, allocationByPoste } = useMemo(() => {
    let total = 0;
    let essentiel = 0;
    let modulable = 0;
    const byPoste: Record<BudgetPoste, number> = {
      "R&D / Prototype": 0,
      "Marketing & Acquisition": 0,
      "Équipement / Infra": 0,
      "Juridique / Propriété Intellectuelle": 0,
      "Opérations / Trésorerie": 0,
    };

    for (const row of draft.lignesBudget) {
      const amount = Number.isFinite(row.montantMad) && row.montantMad > 0 ? row.montantMad : 0;
      total += amount;
      if (row.priorite === "essentiel") {
        essentiel += amount;
      } else {
        modulable += amount;
      }
      if (byPoste[row.poste] !== undefined) {
        byPoste[row.poste] += amount;
      }
    }

    return {
      totalBudgetMad: total,
      totalEssentielMad: essentiel,
      totalModulableMad: modulable,
      allocationByPoste: byPoste,
    };
  }, [draft.lignesBudget]);

  // Pedagogical progress check (R2 warn-only — never blocks submission)
  const sectionStatus = useMemo(() => {
    const s1 =
      draft.famillesSelectionnees.length > 0 &&
      (draft.montantTotalRechercheMad.trim().length > 0 ||
        draft.conditionsAccesIdentifiees.trim().length > 0);
    const s2 =
      totalBudgetMad > 0 &&
      draft.lignesBudget.some((r) => r.description.trim().length > 0 && r.montantMad > 0);
    const s3 = draft.jalons.some(
      (j) => j.jalon.trim().length > 0 && j.livrableAttendu.trim().length > 0,
    );
    const s4 = draft.checklist.some(
      (c) => c.statut !== "À préparer" || c.notes.trim().length > 0,
    );
    const completedCount = [s1, s2, s3, s4].filter(Boolean).length;
    return { s1, s2, s3, s4, completedCount };
  }, [draft, totalBudgetMad]);

  const serializedMarkdown = useMemo(
    () =>
      serializeFundingNeedsMarkdown(
        deliverableTitle,
        draft,
        totalBudgetMad,
        totalEssentielMad,
        totalModulableMad,
      ),
    [deliverableTitle, draft, totalBudgetMad, totalEssentielMad, totalModulableMad],
  );

  // Handlers for Section 1
  function toggleFundingFamily(familyLabel: string) {
    setDraft((prev) => {
      const exists = prev.famillesSelectionnees.includes(familyLabel);
      const next = exists
        ? prev.famillesSelectionnees.filter((f) => f !== familyLabel)
        : [...prev.famillesSelectionnees, familyLabel];
      return { ...prev, famillesSelectionnees: next };
    });
  }

  // Handlers for Section 2 (Budget table)
  function updateBudgetLine(id: string, patch: Partial<BudgetLineItem>) {
    setDraft((prev) => ({
      ...prev,
      lignesBudget: prev.lignesBudget.map((line) =>
        line.id === id ? { ...line, ...patch } : line,
      ),
    }));
  }

  function addBudgetLine() {
    setDraft((prev) => ({
      ...prev,
      lignesBudget: [
        ...prev.lignesBudget,
        {
          id: `budget-${Date.now()}-${prev.lignesBudget.length + 1}`,
          poste: "R&D / Prototype",
          description: "",
          montantMad: 0,
          priorite: "essentiel",
        },
      ],
    }));
  }

  function removeBudgetLine(id: string) {
    setDraft((prev) => {
      if (prev.lignesBudget.length <= 1) return prev;
      return {
        ...prev,
        lignesBudget: prev.lignesBudget.filter((line) => line.id !== id),
      };
    });
  }

  // Handlers for Section 3 (Jalons)
  function updateMilestone(id: string, patch: Partial<FundingMilestoneItem>) {
    setDraft((prev) => ({
      ...prev,
      jalons: prev.jalons.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function addMilestone() {
    setDraft((prev) => ({
      ...prev,
      jalons: [
        ...prev.jalons,
        {
          id: `jalon-${Date.now()}-${prev.jalons.length + 1}`,
          jalon: "",
          echeance: `Mois ${prev.jalons.length * 3 + 1} - Mois ${(prev.jalons.length + 1) * 3}`,
          livrableAttendu: "",
          kpiValidation: "",
        },
      ],
    }));
  }

  function removeMilestone(id: string) {
    setDraft((prev) => {
      if (prev.jalons.length <= 1) return prev;
      return {
        ...prev,
        jalons: prev.jalons.filter((item) => item.id !== id),
      };
    });
  }

  // Handlers for Section 4 (Checklist)
  function updateChecklistItem(id: string, patch: Partial<ApplicationChecklistItem>) {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  const submitLabel = version === 2 ? t.submission_v2_submit : t.submission_submit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
      {/* 1. Mode Switcher Header */}
      <div
        role="tablist"
        aria-label="Mode de soumission du livrable"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 6,
          background: "#f3f4f6",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "studio"}
          onClick={() => setMode("studio")}
          style={{
            flex: "1 1 240px",
            padding: "10px 14px",
            borderRadius: 8,
            border: mode === "studio" ? "1px solid #0B2545" : "1px solid transparent",
            background: mode === "studio" ? "#0B2545" : "transparent",
            color: mode === "studio" ? "#ffffff" : "#374151",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Simulateur & Fiche interactive (recommandé)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "external"}
          onClick={() => setMode("external")}
          style={{
            flex: "1 1 200px",
            padding: "10px 14px",
            borderRadius: 8,
            border: mode === "external" ? "1px solid #0B2545" : "1px solid transparent",
            background: mode === "external" ? "#0B2545" : "transparent",
            color: mode === "external" ? "#ffffff" : "#374151",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Lien externe / Texte libre
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
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
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
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: sectionStatus.completedCount === 4 ? "#f0fdf4" : "#fffbeb",
                border:
                  sectionStatus.completedCount === 4
                    ? "1px solid #86efac"
                    : "1px solid #fcd34d",
                color: sectionStatus.completedCount === 4 ? "#166534" : "#92400e",
                fontSize: 13,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <strong>
                  Progression de la fiche : {sectionStatus.completedCount}/4 volets complétés
                </strong>
                <span style={{ display: "block", marginTop: 2, fontSize: 12 }}>
                  {sectionStatus.completedCount === 4
                    ? "Tous les volets financiers et opérationnels sont renseignés. Vous pouvez soumettre à tout moment."
                    : "Conseil pédagogique (non bloquant) : complétez les 4 volets pour donner à votre mentor une vision claire de votre besoin de financement."}
                </span>
              </div>
              <AutoSaveBadge lastSavedAt={lastSavedAt} />
            </div>

            {initialProofText && initialProofText.trim().length > 0 ? (
              <details
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "#334155" }}>
                  Voir la version précédemment soumise (référence)
                </summary>
                <pre
                  style={{
                    marginTop: 8,
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    color: "#475569",
                  }}
                >
                  {initialProofText}
                </pre>
              </details>
            ) : null}

            {/* ================================================================
                SECTION 1: Stade du Projet & Familles de Financement Ciblées
               ================================================================ */}
            <section
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
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
                      color: "#0B2545",
                    }}
                  >
                    Volet 1 / 4
                  </span>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700 }}>
                    1. Stade du Projet & Familles de Financement Ciblées
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: sectionStatus.s1 ? "#dcfce7" : "#fef3c7",
                    color: sectionStatus.s1 ? "#166534" : "#92400e",
                    fontWeight: 600,
                  }}
                >
                  {sectionStatus.s1 ? "Complété" : "À enrichir"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    Stade actuel de maturité du projet
                  </span>
                  <select
                    value={draft.stadeProjet}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, stadeProjet: e.target.value }))
                    }
                    className="eic-form-input"
                    style={{
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                    }}
                  >
                    {PROJECT_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    Montant total recherché (MAD)
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={draft.montantTotalRechercheMad}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          montantTotalRechercheMad: e.target.value,
                        }))
                      }
                      placeholder="Ex: 150000"
                      className="eic-form-input"
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                      }}
                    />
                    {totalBudgetMad > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            montantTotalRechercheMad: String(totalBudgetMad),
                          }))
                        }
                        title="Aligner sur le total du simulateur de budget"
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0B2545",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        = Budget ({formatMad(totalBudgetMad)})
                      </button>
                    ) : null}
                  </div>
                </label>
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Familles de financement pertinentes (cliquez pour sélectionner une ou plusieurs options)
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 10,
                  }}
                >
                  {FUNDING_FAMILIES.map((family) => {
                    const selected = draft.famillesSelectionnees.includes(family.label);
                    return (
                      <button
                        key={family.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleFundingFamily(family.label)}
                        style={{
                          textAlign: "left",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: selected
                            ? "2px solid #0B2545"
                            : "1px solid #d1d5db",
                          background: selected ? "#f0f7ff" : "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          transition: "all 0.15s ease",
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
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#111827",
                              lineHeight: 1.35,
                            }}
                          >
                            {selected ? "✓ " : ""}
                            {family.label}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: selected ? "#0B2545" : "#f3f4f6",
                              color: selected ? "#ffffff" : "#4b5563",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {family.tag}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#4b5563",
                            lineHeight: 1.4,
                          }}
                        >
                          {family.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Conditions d&apos;accès, prérequis & critères d&apos;éligibilité identifiés
                </span>
                <textarea
                  rows={3}
                  value={draft.conditionsAccesIdentifiees}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      conditionsAccesIdentifiees: e.target.value,
                    }))
                  }
                  placeholder="Ex: Labellisation structure d'accompagnement pour Innov Idea, apport personnel 20%, création SARL au Maroc, devis contradictoires..."
                  className="eic-form-textarea"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                  }}
                />
              </label>
            </section>

            {/* ================================================================
                SECTION 2: Simulateur de Budget & Utilisation des Fonds
               ================================================================ */}
            <section
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: 16,
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
                      color: "#0B2545",
                    }}
                  >
                    Volet 2 / 4
                  </span>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700 }}>
                    2. Simulateur de Budget & Utilisation des Fonds
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: sectionStatus.s2 ? "#dcfce7" : "#fef3c7",
                    color: sectionStatus.s2 ? "#166534" : "#92400e",
                    fontWeight: 600,
                  }}
                >
                  {sectionStatus.s2 ? "Complété" : "À chiffrer"}
                </span>
              </div>

              {/* Summary KPI cards for budget simulator */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#0B2545",
                    color: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.85, textTransform: "uppercase" }}>
                    Budget Total Estimé
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                    {formatMad(totalBudgetMad)}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#14532d",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                    Dépenses Essentielles
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    {formatMad(totalEssentielMad)}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#334155",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
                    Dépenses Modulables
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    {formatMad(totalModulableMad)}
                  </div>
                </div>
              </div>

              {/* Interactive Budget Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {draft.lignesBudget.map((line, idx) => (
                  <div
                    key={line.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(180px, 1.2fr) minmax(200px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr) auto",
                      gap: 8,
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 10,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <select
                      aria-label={`Poste budgétaire ligne ${idx + 1}`}
                      value={line.poste}
                      onChange={(e) =>
                        updateBudgetLine(line.id, {
                          poste: e.target.value as BudgetPoste,
                        })
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        fontSize: 13,
                      }}
                    >
                      {BUDGET_POSTES.map((item) => (
                        <option key={item.poste} value={item.poste}>
                          {item.poste}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      aria-label={`Description dépense ligne ${idx + 1}`}
                      value={line.description}
                      onChange={(e) =>
                        updateBudgetLine(line.id, { description: e.target.value })
                      }
                      placeholder="Description précise (ex: Serveurs cloud + API, campagne test...)"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        fontSize: 13,
                      }}
                    />

                    <input
                      type="number"
                      min={0}
                      step={500}
                      aria-label={`Montant en MAD ligne ${idx + 1}`}
                      value={line.montantMad === 0 ? "" : line.montantMad}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        updateBudgetLine(line.id, {
                          montantMad: Number.isFinite(val) && val >= 0 ? val : 0,
                        });
                      }}
                      placeholder="Montant MAD"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        fontSize: 13,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        updateBudgetLine(line.id, {
                          priorite:
                            line.priorite === "essentiel" ? "modulable" : "essentiel",
                        })
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border:
                          line.priorite === "essentiel"
                            ? "1px solid #16a34a"
                            : "1px solid #94a3b8",
                        background:
                          line.priorite === "essentiel" ? "#dcfce7" : "#f1f5f9",
                        color: line.priorite === "essentiel" ? "#166534" : "#334155",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {line.priorite === "essentiel" ? "⚡ Essentiel" : "🔄 Modulable"}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeBudgetLine(line.id)}
                      aria-label={`Supprimer la ligne budgétaire ${idx + 1}`}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 8,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={addBudgetLine}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px dashed #0B2545",
                      background: "#f8fafc",
                      color: "#0B2545",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Ajouter un poste de dépense
                  </button>
                </div>
              </div>

              {/* Visual Allocation Bars per Category */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                  Répartition visuelle de l&apos;allocation des fonds par catégorie
                </div>
                {BUDGET_POSTES.map((cat) => {
                  const catAmount = allocationByPoste[cat.poste] ?? 0;
                  const pct =
                    totalBudgetMad > 0
                      ? Math.round((catAmount / totalBudgetMad) * 100)
                      : 0;
                  return (
                    <div
                      key={cat.poste}
                      style={{ display: "flex", flexDirection: "column", gap: 4 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <span>{cat.poste}</span>
                        <span>
                          {formatMad(catAmount)} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            height: "100%",
                            background: cat.color,
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ================================================================
                SECTION 3: Jalons (Milestones) & Résultats Attendus
               ================================================================ */}
            <section
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
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
                      color: "#0B2545",
                    }}
                  >
                    Volet 3 / 4
                  </span>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700 }}>
                    3. Jalons (Milestones) & Résultats Attendus
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: sectionStatus.s3 ? "#dcfce7" : "#fef3c7",
                    color: sectionStatus.s3 ? "#166534" : "#92400e",
                    fontWeight: 600,
                  }}
                >
                  {sectionStatus.s3 ? "Complété" : "À détailler"}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
                Reliez l&apos;utilisation des fonds à des étapes vérifiables : que permettra d&apos;atteindre chaque tranche de financement ?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {draft.jalons.map((milestone, idx) => (
                  <div
                    key={milestone.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
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
                        gap: 8,
                      }}
                    >
                      <strong style={{ fontSize: 13, color: "#0B2545" }}>
                        Jalon #{idx + 1}
                      </strong>
                      <button
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                        style={{
                          padding: "4px 8px",
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
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Intitulé du jalon
                        </span>
                        <input
                          type="text"
                          value={milestone.jalon}
                          onChange={(e) =>
                            updateMilestone(milestone.id, { jalon: e.target.value })
                          }
                          placeholder="Ex: Lancement du MVP fonctionnel auprès de 30 pilotes"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Horizon / Échéance
                        </span>
                        <input
                          type="text"
                          value={milestone.echeance}
                          onChange={(e) =>
                            updateMilestone(milestone.id, { echeance: e.target.value })
                          }
                          placeholder="Ex: M+3 après déblocage des fonds"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Livrable concret attendu
                        </span>
                        <input
                          type="text"
                          value={milestone.livrableAttendu}
                          onChange={(e) =>
                            updateMilestone(milestone.id, {
                              livrableAttendu: e.target.value,
                            })
                          }
                          placeholder="Ex: Application mobile déployée + 1er contrat partenaire"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Indicateur (KPI) de validation
                        </span>
                        <input
                          type="text"
                          value={milestone.kpiValidation}
                          onChange={(e) =>
                            updateMilestone(milestone.id, {
                              kpiValidation: e.target.value,
                            })
                          }
                          placeholder="Ex: 50 utilisateurs actifs hebdomadaires / 10 commandes"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#ffffff",
                            fontSize: 13,
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={addMilestone}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px dashed #0B2545",
                      background: "#f8fafc",
                      color: "#0B2545",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Ajouter un jalon (milestone)
                  </button>
                </div>
              </div>
            </section>

            {/* ================================================================
                SECTION 4: Checklist des Éléments à Réunir pour une Candidature
               ================================================================ */}
            <section
              style={{
                padding: 18,
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
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
                      color: "#0B2545",
                    }}
                  >
                    Volet 4 / 4
                  </span>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700 }}>
                    4. Checklist des Éléments à Réunir pour une Candidature
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: sectionStatus.s4 ? "#dcfce7" : "#fef3c7",
                    color: sectionStatus.s4 ? "#166534" : "#92400e",
                    fontWeight: 600,
                  }}
                >
                  {sectionStatus.s4 ? "Complété" : "À vérifier"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {draft.checklist.map((item) => {
                  const statusOptions: ChecklistReadiness[] = [
                    "Prêt",
                    "En cours",
                    "À préparer",
                  ];
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(180px, 1.2fr) auto minmax(200px, 2fr)",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        {item.element}
                      </span>

                      <div style={{ display: "flex", gap: 4 }}>
                        {statusOptions.map((statusOption) => {
                          const active = item.statut === statusOption;
                          const bgColor =
                            statusOption === "Prêt"
                              ? "#16a34a"
                              : statusOption === "En cours"
                                ? "#d97706"
                                : "#475569";
                          return (
                            <button
                              key={statusOption}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                updateChecklistItem(item.id, { statut: statusOption })
                              }
                              style={{
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: active
                                  ? `1px solid ${bgColor}`
                                  : "1px solid #cbd5e1",
                                background: active ? bgColor : "#ffffff",
                                color: active ? "#ffffff" : "#475569",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>

                      <input
                        type="text"
                        aria-label={`Notes pour ${item.element}`}
                        value={item.notes}
                        onChange={(e) =>
                          updateChecklistItem(item.id, { notes: e.target.value })
                        }
                        placeholder="Précisions / responsable / pièce à joindre..."
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          background: "#ffffff",
                          fontSize: 12,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Optional Markdown Preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showPreview
                  ? "Masquer l'aperçu du document transmis au mentor"
                  : "Afficher l'aperçu du document transmis au mentor"}
              </button>

              {showPreview ? (
                <pre
                  style={{
                    margin: 0,
                    padding: 14,
                    borderRadius: 8,
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                  }}
                >
                  {serializedMarkdown}
                </pre>
              ) : null}
            </div>

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
                style={{ minWidth: 220 }}
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
