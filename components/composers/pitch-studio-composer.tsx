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

export type PitchSlideItem = {
  num: number;
  titre: string;
  conseil: string;
  messageCleSlide: string;
  visuelOuPreuve: string;
  dureeSecondes: number;
  orateur: string;
};

export type ObjectionCategory =
  | "Marche"
  | "Modele_Economique"
  | "Technique"
  | "Equipe_Financement";

export type PitchObjectionCard = {
  id: string;
  categorie: ObjectionCategory;
  objectionJury: string;
  reponsePreparee: string;
  preuveChiffree: string;
};

type PitchStudioDraftState = {
  slides: PitchSlideItem[];
  lienSupportSlides: string;
  objections: PitchObjectionCard[];
  ajustementsApresPitchABlanc: string;
  demandeFinaleJury: string;
};

const DEFAULT_SLIDES: PitchSlideItem[] = [
  {
    num: 1,
    titre: "Slide 1 — Accroche & Problème identifié",
    conseil: "Captez l'attention en 10s (chiffre choc, histoire vraie) et formulez la douleur client.",
    messageCleSlide: "",
    visuelOuPreuve: "",
    dureeSecondes: 30,
    orateur: "",
  },
  {
    num: 2,
    titre: "Slide 2 — Solution & Proposition de valeur",
    conseil: "Montrez comment votre solution résout concrètement le problème (bénéfice clé, démo ou maquette).",
    messageCleSlide: "",
    visuelOuPreuve: "",
    dureeSecondes: 30,
    orateur: "",
  },
  {
    num: 3,
    titre: "Slide 3 — Marché cible & Positionnement",
    conseil: "Qui sont vos premiers clients (SOM) et pourquoi vous choisissent-ils face aux alternatives ?",
    messageCleSlide: "",
    visuelOuPreuve: "",
    dureeSecondes: 30,
    orateur: "",
  },
  {
    num: 4,
    titre: "Slide 4 — Business Model & Faisabilité technique",
    conseil: "Comment gagnez-vous de l'argent (tarification, marges) et quelle est la faisabilité du MVP ?",
    messageCleSlide: "",
    visuelOuPreuve: "",
    dureeSecondes: 30,
    orateur: "",
  },
  {
    num: 5,
    titre: "Slide 5 — Go-to-Market, Financement & Prochaines étapes",
    conseil: "Plan d'acquisition des premiers clients, besoin de financement et jalons à 3-6 mois.",
    messageCleSlide: "",
    visuelOuPreuve: "",
    dureeSecondes: 30,
    orateur: "",
  },
  {
    num: 6,
    titre: "Slide 6 — L'Équipe & Demande précise (Client / Partenaire / Financeur)",
    conseil: "Complémentarité de l'équipe et appel à l'action clair envers le jury.",
    messageCleSlide: "",
    visuelOuPreuve: "",
    dureeSecondes: 30,
    orateur: "",
  },
];

const DEFAULT_OBJECTIONS: PitchObjectionCard[] = [
  {
    id: "obj-1",
    categorie: "Marche",
    objectionJury: "",
    reponsePreparee: "",
    preuveChiffree: "",
  },
  {
    id: "obj-2",
    categorie: "Modele_Economique",
    objectionJury: "",
    reponsePreparee: "",
    preuveChiffree: "",
  },
  {
    id: "obj-3",
    categorie: "Technique",
    objectionJury: "",
    reponsePreparee: "",
    preuveChiffree: "",
  },
];

const CATEGORY_META: Record<
  ObjectionCategory,
  { label: string; badgeBg: string; badgeColor: string; promptExample: string }
> = {
  Marche: {
    label: "Marché & Cible",
    badgeBg: "#dbeafe",
    badgeColor: "#1e40af",
    promptExample: "Ex: Pourquoi vos clients changeraient-ils leurs habitudes actuelles ?",
  },
  Modele_Economique: {
    label: "Modèle Économique",
    badgeBg: "#dcfce7",
    badgeColor: "#166534",
    promptExample: "Ex: Votre coût d'acquisition client ne risque-t-il pas de dépasser votre marge ?",
  },
  Technique: {
    label: "Technique & Produit",
    badgeBg: "#fef3c7",
    badgeColor: "#92400e",
    promptExample: "Ex: Comment allez-vous construire et déployer le MVP en moins de 3 mois ?",
  },
  Equipe_Financement: {
    label: "Équipe & Financement",
    badgeBg: "#f3e8ff",
    badgeColor: "#6b21a8",
    promptExample: "Ex: Avez-vous les compétences internes pour exécuter ce plan avec ce budget ?",
  },
};

function createDefaultState(initialProofUrl?: string | null): PitchStudioDraftState {
  return {
    slides: DEFAULT_SLIDES.map((s) => ({ ...s })),
    lienSupportSlides: initialProofUrl?.trim() ?? "",
    objections: DEFAULT_OBJECTIONS.map((o) => ({ ...o })),
    ajustementsApresPitchABlanc: "",
    demandeFinaleJury: "",
  };
}

function serializePitchStudioToMarkdown(
  deliverableTitle: string,
  deliverableSlug: string,
  draft: PitchStudioDraftState,
): string {
  const lines: string[] = [];
  const totalSeconds = draft.slides.reduce(
    (acc, s) => acc + (Number.isFinite(s.dureeSecondes) ? Math.max(0, s.dureeSecondes) : 0),
    0,
  );

  const filledSlides = draft.slides.filter(
    (s) =>
      s.messageCleSlide.trim().length > 0 ||
      s.visuelOuPreuve.trim().length > 0 ||
      s.orateur.trim().length > 0,
  );

  const filledObjections = draft.objections.filter(
    (o) =>
      o.objectionJury.trim().length > 0 ||
      o.reponsePreparee.trim().length > 0 ||
      o.preuveChiffree.trim().length > 0,
  );

  const hasSupportLink = draft.lienSupportSlides.trim().length > 0;
  const hasAjustements = draft.ajustementsApresPitchABlanc.trim().length > 0;
  const hasDemandeFinale = draft.demandeFinaleJury.trim().length > 0;

  if (
    filledSlides.length === 0 &&
    filledObjections.length === 0 &&
    !hasSupportLink &&
    !hasAjustements &&
    !hasDemandeFinale
  ) {
    return "";
  }

  lines.push(`# ${deliverableTitle}`);
  lines.push("");

  if (hasSupportLink) {
    lines.push(`## Lien du support de présentation (Slides)`);
    lines.push(`- **Support de présentation** : ${draft.lienSupportSlides.trim()}`);
    lines.push("");
  }

  const writeSlidesSection = () => {
    if (filledSlides.length === 0 && !hasSupportLink) return;
    lines.push(`## 1. Storyboard 6 Diapositives & Chronomètre (${totalSeconds}s / 180s)`);
    lines.push("");
    for (const slide of draft.slides) {
      const msg = slide.messageCleSlide.trim();
      const visuel = slide.visuelOuPreuve.trim();
      const orateur = slide.orateur.trim();
      if (!msg && !visuel && !orateur) continue;
      lines.push(
        `### ${slide.titre} (${slide.dureeSecondes}s${orateur ? ` — Orateur : ${orateur}` : ""})`,
      );
      if (msg) {
        lines.push(`- **Message clé** : ${msg}`);
      }
      if (visuel) {
        lines.push(`- **Visuel / Preuve à l'écran** : ${visuel}`);
      }
      lines.push("");
    }
  };

  const writeObjectionsSection = () => {
    if (filledObjections.length === 0 && !hasAjustements && !hasDemandeFinale) return;
    lines.push(`## 2. Entraînement Q&A : Réponses aux Objections & Pitch à Blanc`);
    lines.push("");
    if (filledObjections.length > 0) {
      lines.push(`### Réponses préparées aux objections du jury`);
      lines.push("");
      filledObjections.forEach((obj, idx) => {
        const catLabel = CATEGORY_META[obj.categorie]?.label ?? obj.categorie;
        lines.push(
          `#### Objection ${idx + 1} [${catLabel}] : ${obj.objectionJury.trim() || "(Objection à préciser)"}`,
        );
        if (obj.reponsePreparee.trim()) {
          lines.push(`- **Réponse préparée** : ${obj.reponsePreparee.trim()}`);
        }
        if (obj.preuveChiffree.trim()) {
          lines.push(`- **Preuve chiffrée / Verbatim** : ${obj.preuveChiffree.trim()}`);
        }
        lines.push("");
      });
    }
    if (hasAjustements) {
      lines.push(`### Ajustements retenus après le Pitch à blanc`);
      lines.push(draft.ajustementsApresPitchABlanc.trim());
      lines.push("");
    }
    if (hasDemandeFinale) {
      lines.push(`### Demande finale au Jury (Call-to-Action)`);
      lines.push(draft.demandeFinaleJury.trim());
      lines.push("");
    }
  };

  if (deliverableSlug === "pitch-final-objections-v1") {
    writeObjectionsSection();
    writeSlidesSection();
  } else {
    writeSlidesSection();
    writeObjectionsSection();
  }

  return lines.join("\n").trim();
}

export function PitchStudioComposer({
  deliverableTemplateId,
  deliverableSlug,
  deliverableTitle,
  playerId,
  version = 1,
  initialProofText,
  initialProofUrl,
}: InteractiveDeliverableComposerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"studio" | "fallback">("studio");
  const isFinalObjectionsSlug = deliverableSlug === "pitch-final-objections-v1";
  const [activeTab, setActiveTab] = useState<"all" | "storyboard" | "qa">("all");
  const [rehearsalCardIndex, setRehearsalCardIndex] = useState<number | null>(null);
  const [rehearsalShowAnswer, setRehearsalShowAnswer] = useState<boolean>(false);

  const storageKey = useMemo(
    () => `${buildDraftStorageKey({ playerId, deliverableTemplateId, version })}_studio`,
    [playerId, deliverableTemplateId, version],
  );

  const [draft, setDraft] = useState<PitchStudioDraftState>(() =>
    createDefaultState(initialProofUrl),
  );
  const [hydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [state, formAction, pending] = useActionState(
    submitDeliverable,
    initialActionState,
  );
  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PitchStudioDraftState>;
        setDraft((prev) => ({
          slides:
            Array.isArray(parsed.slides) && parsed.slides.length === 6
              ? parsed.slides.map((s, idx) => ({
                  num: idx + 1,
                  titre: DEFAULT_SLIDES[idx].titre,
                  conseil: DEFAULT_SLIDES[idx].conseil,
                  messageCleSlide:
                    typeof s?.messageCleSlide === "string" ? s.messageCleSlide : "",
                  visuelOuPreuve:
                    typeof s?.visuelOuPreuve === "string" ? s.visuelOuPreuve : "",
                  dureeSecondes:
                    typeof s?.dureeSecondes === "number" && !Number.isNaN(s.dureeSecondes)
                      ? s.dureeSecondes
                      : 30,
                  orateur: typeof s?.orateur === "string" ? s.orateur : "",
                }))
              : prev.slides,
          lienSupportSlides:
            typeof parsed.lienSupportSlides === "string"
              ? parsed.lienSupportSlides
              : prev.lienSupportSlides,
          objections:
            Array.isArray(parsed.objections) && parsed.objections.length > 0
              ? parsed.objections.map((o, idx) => ({
                  id: typeof o?.id === "string" ? o.id : `obj-${idx + 1}`,
                  categorie:
                    o?.categorie === "Marche" ||
                    o?.categorie === "Modele_Economique" ||
                    o?.categorie === "Technique" ||
                    o?.categorie === "Equipe_Financement"
                      ? o.categorie
                      : "Marche",
                  objectionJury:
                    typeof o?.objectionJury === "string" ? o.objectionJury : "",
                  reponsePreparee:
                    typeof o?.reponsePreparee === "string" ? o.reponsePreparee : "",
                  preuveChiffree:
                    typeof o?.preuveChiffree === "string" ? o.preuveChiffree : "",
                }))
              : prev.objections,
          ajustementsApresPitchABlanc:
            typeof parsed.ajustementsApresPitchABlanc === "string"
              ? parsed.ajustementsApresPitchABlanc
              : prev.ajustementsApresPitchABlanc,
          demandeFinaleJury:
            typeof parsed.demandeFinaleJury === "string"
              ? parsed.demandeFinaleJury
              : prev.demandeFinaleJury,
        }));
        setLastSavedAt(new Date());
      } else if (initialProofText && initialProofText.trim().length > 0) {
        // Pre-populate adjustment note if revising V2 without a local studio draft
        setDraft((prev) => ({
          ...prev,
          ajustementsApresPitchABlanc: prev.ajustementsApresPitchABlanc || "",
        }));
      }
    } catch {
      // Ignore storage errors in private browsing
    } finally {
      setHydrated(true);
    }
  }, [storageKey, initialProofText]);

  // Persist draft to localStorage on change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      setLastSavedAt(new Date());
    } catch {
      // Ignore quota/privacy errors
    }
  }, [draft, hydrated, storageKey]);

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
          // noop
        }
      }
      router.refresh();
    }
  }, [state.ok, deliverableTemplateId, version, storageKey, router]);

  const totalSeconds = useMemo(
    () =>
      draft.slides.reduce(
        (acc, s) => acc + (Number.isFinite(s.dureeSecondes) ? Math.max(0, s.dureeSecondes) : 0),
        0,
      ),
    [draft.slides],
  );

  const filledSlideCount = useMemo(
    () =>
      draft.slides.filter(
        (s) => s.messageCleSlide.trim().length > 0 || s.visuelOuPreuve.trim().length > 0,
      ).length,
    [draft.slides],
  );

  const filledObjectionCount = useMemo(
    () =>
      draft.objections.filter(
        (o) => o.objectionJury.trim().length > 0 && o.reponsePreparee.trim().length > 0,
      ).length,
    [draft.objections],
  );

  const serializedMarkdown = useMemo(
    () => serializePitchStudioToMarkdown(deliverableTitle, deliverableSlug, draft),
    [deliverableTitle, deliverableSlug, draft],
  );

  const updateSlide = (index: number, patch: Partial<PitchSlideItem>) => {
    setDraft((prev) => {
      const next = [...prev.slides];
      next[index] = { ...next[index], ...patch };
      return { ...prev, slides: next };
    });
  };

  const updateObjection = (id: string, patch: Partial<PitchObjectionCard>) => {
    setDraft((prev) => ({
      ...prev,
      objections: prev.objections.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  const addObjectionCard = () => {
    const categories: ObjectionCategory[] = [
      "Marche",
      "Modele_Economique",
      "Technique",
      "Equipe_Financement",
    ];
    const nextCat = categories[draft.objections.length % categories.length];
    setDraft((prev) => ({
      ...prev,
      objections: [
        ...prev.objections,
        {
          id: `obj-${Date.now()}-${prev.objections.length + 1}`,
          categorie: nextCat,
          objectionJury: "",
          reponsePreparee: "",
          preuveChiffree: "",
        },
      ],
    }));
  };

  const removeObjectionCard = (id: string) => {
    if (draft.objections.length <= 1) return;
    setDraft((prev) => ({
      ...prev,
      objections: prev.objections.filter((o) => o.id !== id),
    }));
    setRehearsalCardIndex(null);
  };

  const submitLabel = version === 2 ? t.submission_v2_submit : t.submission_submit;
  const isOverTimeBudget = totalSeconds > 180;
  const timeBudgetPercent = Math.min(100, Math.round((totalSeconds / 180) * 100));

  const renderStoryboardSection = () => (
    <section
      aria-label="Storyboard 6 Diapositives & Chronomètre 3 Minutes"
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
          justifyContent: "space-between",
          alignItems: "center",
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
              color: "#475569",
            }}
          >
            Section 1 · Storyboard & Timing
          </span>
          <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
            Storyboard 6 Diapositives & Chronomètre 3 Minutes (180 secondes)
          </h3>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
            background: filledSlideCount >= 5 ? "#dcfce7" : "#fef3c7",
            color: filledSlideCount >= 5 ? "#166534" : "#92400e",
          }}
        >
          {filledSlideCount} / 6 slides renseignées
        </span>
      </div>

      {/* Time budget bar */}
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          background: isOverTimeBudget ? "#fffbeb" : "#f8fafc",
          border: `1px solid ${isOverTimeBudget ? "#f59e0b" : "#cbd5e1"}`,
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
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <strong style={{ fontSize: 13, color: "#0f172a" }}>
            ⏱️ Budget temps du pitch : Total : {totalSeconds} / 180 secondes
          </strong>
          {isOverTimeBudget ? (
            <span
              role="status"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#92400e",
                background: "#fef3c7",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              ⚠ Dépassement de {totalSeconds - 180}s (conseil : visez 180s max, non bloquant)
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#475569" }}>
              {180 - totalSeconds}s disponibles sur les 3 minutes
            </span>
          )}
        </div>
        <div
          style={{
            width: "100%",
            height: 8,
            borderRadius: 999,
            background: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${timeBudgetPercent}%`,
              height: "100%",
              background: isOverTimeBudget ? "#d97706" : "#2563eb",
              transition: "width 0.2s ease",
            }}
          />
        </div>
      </div>

      {/* Optional slide deck link */}
      <label className="eic-form-field" style={{ margin: 0 }}>
        <span className="eic-form-field__label" style={{ fontWeight: 600 }}>
          Lien du support de présentation (Canva, Google Slides, OneDrive, Pitch — optionnel)
        </span>
        <input
          type="url"
          value={draft.lienSupportSlides}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, lienSupportSlides: e.target.value }))
          }
          placeholder="https://www.canva.com/... ou https://docs.google.com/presentation/..."
          className="eic-form-input"
        />
      </label>

      {/* 6 interactive slide cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {draft.slides.map((slide, idx) => (
          <div
            key={slide.num}
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
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {slide.titre}
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569" }}>
                  {slide.conseil}
                </p>
              </div>
            </div>

            <label className="eic-form-field" style={{ margin: 0 }}>
              <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                Message clé de la diapositive
              </span>
              <textarea
                rows={2}
                value={slide.messageCleSlide}
                onChange={(e) => updateSlide(idx, { messageCleSlide: e.target.value })}
                placeholder="Quelle est la phrase essentielle que le jury doit retenir ?"
                className="eic-form-textarea"
              />
            </label>

            <label className="eic-form-field" style={{ margin: 0 }}>
              <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                Visuel ou preuve à l&apos;écran
              </span>
              <input
                type="text"
                value={slide.visuelOuPreuve}
                onChange={(e) => updateSlide(idx, { visuelOuPreuve: e.target.value })}
                placeholder="Ex: Photo terrain, graphique TAM/SAM/SOM, démo 3 écrans..."
                className="eic-form-input"
              />
            </label>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="eic-form-field" style={{ margin: 0, flex: "1 1 110px" }}>
                <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                  Durée (secondes)
                </span>
                <input
                  type="number"
                  min={0}
                  max={180}
                  step={5}
                  value={slide.dureeSecondes}
                  onChange={(e) =>
                    updateSlide(idx, {
                      dureeSecondes: Math.max(0, parseInt(e.target.value || "0", 10) || 0),
                    })
                  }
                  className="eic-form-input"
                />
              </label>

              <label className="eic-form-field" style={{ margin: 0, flex: "1 1 130px" }}>
                <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                  Orateur·rice
                </span>
                <input
                  type="text"
                  value={slide.orateur}
                  onChange={(e) => updateSlide(idx, { orateur: e.target.value })}
                  placeholder="Prénom du pitcheur"
                  className="eic-form-input"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderQaObjectionsSection = () => (
    <section
      aria-label="Entraînement Q&A : Réponses aux Principales Objections du Jury & Ajustements Pitch à Blanc"
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
          justifyContent: "space-between",
          alignItems: "center",
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
              color: "#475569",
            }}
          >
            Section 2 · Q&A Jury & Pitch à Blanc
          </span>
          <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
            Entraînement Q&A : Réponses aux Principales Objections du Jury & Ajustements Pitch à Blanc
          </h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
              background: filledObjectionCount >= 2 ? "#dcfce7" : "#fef3c7",
              color: filledObjectionCount >= 2 ? "#166534" : "#92400e",
            }}
          >
            {filledObjectionCount} objection(s) préparée(s)
          </span>
          <button
            type="button"
            onClick={() => {
              if (rehearsalCardIndex === null) {
                setRehearsalCardIndex(0);
                setRehearsalShowAnswer(false);
              } else {
                setRehearsalCardIndex(null);
              }
            }}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: rehearsalCardIndex !== null ? "#0f172a" : "#f8fafc",
              color: rehearsalCardIndex !== null ? "#ffffff" : "#0f172a",
              cursor: "pointer",
            }}
          >
            {rehearsalCardIndex !== null ? "Fermer le simulateur Q&A" : "🎯 Tester en mode Flashcard"}
          </button>
        </div>
      </div>

      {/* Interactive Flashcard Rehearsal Simulator */}
      {rehearsalCardIndex !== null && draft.objections[rehearsalCardIndex] ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "#0f172a",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Simulation Q&A Jury — Carte {rehearsalCardIndex + 1} / {draft.objections.length} (
              {CATEGORY_META[draft.objections[rehearsalCardIndex].categorie].label})
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  setRehearsalCardIndex(
                    (rehearsalCardIndex - 1 + draft.objections.length) % draft.objections.length,
                  );
                  setRehearsalShowAnswer(false);
                }}
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                ← Précédente
              </button>
              <button
                type="button"
                onClick={() => {
                  setRehearsalCardIndex((rehearsalCardIndex + 1) % draft.objections.length);
                  setRehearsalShowAnswer(false);
                }}
                style={{
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                Suivante →
              </button>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
            «{" "}
            {draft.objections[rehearsalCardIndex].objectionJury.trim() ||
              CATEGORY_META[draft.objections[rehearsalCardIndex].categorie].promptExample}{" "}
            »
          </p>

          {rehearsalShowAnswer ? (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#1e293b",
                border: "1px solid #334155",
                fontSize: 13,
              }}
            >
              <p style={{ margin: "0 0 6px" }}>
                <strong>Réponse :</strong>{" "}
                {draft.objections[rehearsalCardIndex].reponsePreparee.trim() ||
                  "(Aucune réponse rédigée pour le moment)"}
              </p>
              {draft.objections[rehearsalCardIndex].preuveChiffree.trim() ? (
                <p style={{ margin: 0, color: "#cbd5e1" }}>
                  <strong>Preuve / Chiffre :</strong>{" "}
                  {draft.objections[rehearsalCardIndex].preuveChiffree.trim()}
                </p>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRehearsalShowAnswer(true)}
              style={{
                alignSelf: "flex-start",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: "#3b82f6",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Révéler notre réponse préparée
            </button>
          )}
        </div>
      ) : null}

      {/* Objection Flashcards Editor */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {draft.objections.map((card, idx) => {
          const catMeta = CATEGORY_META[card.categorie];
          return (
            <div
              key={card.id}
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    Flashcard Q&A #{idx + 1}
                  </span>
                  <select
                    aria-label={`Catégorie de l'objection ${idx + 1}`}
                    value={card.categorie}
                    onChange={(e) =>
                      updateObjection(card.id, {
                        categorie: e.target.value as ObjectionCategory,
                      })
                    }
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: catMeta.badgeBg,
                      color: catMeta.badgeColor,
                    }}
                  >
                    <option value="Marche">Marché & Cible</option>
                    <option value="Modele_Economique">Modèle Économique</option>
                    <option value="Technique">Technique & Produit</option>
                    <option value="Equipe_Financement">Équipe & Financement</option>
                  </select>
                </div>

                {draft.objections.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeObjectionCard(card.id)}
                    style={{
                      fontSize: 12,
                      color: "#b91c1c",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>

              <label className="eic-form-field" style={{ margin: 0 }}>
                <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                  Objection redoutée du Jury
                </span>
                <input
                  type="text"
                  value={card.objectionJury}
                  onChange={(e) => updateObjection(card.id, { objectionJury: e.target.value })}
                  placeholder={catMeta.promptExample}
                  className="eic-form-input"
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 10,
                }}
              >
                <label className="eic-form-field" style={{ margin: 0 }}>
                  <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                    Réponse préparée (concise, directe, rassurante)
                  </span>
                  <textarea
                    rows={2}
                    value={card.reponsePreparee}
                    onChange={(e) =>
                      updateObjection(card.id, { reponsePreparee: e.target.value })
                    }
                    placeholder="Comment répondez-vous en moins de 20 secondes ?"
                    className="eic-form-textarea"
                  />
                </label>

                <label className="eic-form-field" style={{ margin: 0 }}>
                  <span className="eic-form-field__label" style={{ fontSize: 12 }}>
                    Preuve chiffrée / Verbatim terrain à l&apos;appui
                  </span>
                  <textarea
                    rows={2}
                    value={card.preuveChiffree}
                    onChange={(e) =>
                      updateObjection(card.id, { preuveChiffree: e.target.value })
                    }
                    placeholder="Ex: 7 entretiens sur 10 confirment ce besoin, coût pilote de X MAD..."
                    className="eic-form-textarea"
                  />
                </label>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addObjectionCard}
          style={{
            alignSelf: "flex-start",
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px dashed #64748b",
            background: "#f8fafc",
            color: "#0f172a",
            cursor: "pointer",
          }}
        >
          + Ajouter une objection du jury
        </button>
      </div>

      {/* Ajustements après pitch à blanc & Demande finale */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
          paddingTop: 8,
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <label className="eic-form-field" style={{ margin: 0 }}>
          <span className="eic-form-field__label" style={{ fontWeight: 600 }}>
            Ajustements réalisés après le Pitch à blanc (retours mentors / pairs)
          </span>
          <textarea
            rows={3}
            value={draft.ajustementsApresPitchABlanc}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, ajustementsApresPitchABlanc: e.target.value }))
            }
            placeholder="Qu'avez-vous clarifié, raccourci ou reformulé suite au passage à blanc ?"
            className="eic-form-textarea"
          />
        </label>

        <label className="eic-form-field" style={{ margin: 0 }}>
          <span className="eic-form-field__label" style={{ fontWeight: 600 }}>
            Demande finale au Jury (Call-to-Action de clôture)
          </span>
          <textarea
            rows={3}
            value={draft.demandeFinaleJury}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, demandeFinaleJury: e.target.value }))
            }
            placeholder="Que demandez-vous en conclusion ? (Accès pilote client, partenariat clé, financement d'amorçage...)"
            className="eic-form-textarea"
          />
        </label>
      </div>
    </section>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
      {/* Mode Switcher Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 6,
          borderRadius: 10,
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
        }}
        role="tablist"
        aria-label="Mode de rédaction du livrable"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "studio"}
          onClick={() => setMode("studio")}
          style={{
            flex: "1 1 220px",
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            background: mode === "studio" ? "#0f172a" : "transparent",
            color: mode === "studio" ? "#ffffff" : "#475569",
          }}
        >
          Studio Pitch interactif (recommandé)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "fallback"}
          onClick={() => setMode("fallback")}
          style={{
            flex: "1 1 220px",
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            background: mode === "fallback" ? "#0f172a" : "transparent",
            color: mode === "fallback" ? "#ffffff" : "#475569",
          }}
        >
          Lien externe seul / Texte libre
        </button>
      </div>

      {mode === "fallback" ? (
        <SubmissionForm
          deliverableTemplateId={deliverableTemplateId}
          playerId={playerId}
          version={version}
        />
      ) : (
        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <input
            type="hidden"
            name="deliverableTemplateId"
            value={deliverableTemplateId}
          />
          <input type="hidden" name="kind" value="proof_text" />
          <input type="hidden" name="proofText" value={serializedMarkdown} />

          {/* Section Focus Filter (both sections always accessible) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>
              {isFinalObjectionsSlug
                ? "Focus recommandé : Objections du jury & Ajustements Pitch à blanc (+ Storyboard 6 slides)"
                : "Focus recommandé : Storyboard 6 diapositives & Chronomètre 3 min (+ Entraînement Q&A)"}
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: activeTab === "all" ? "#e2e8f0" : "#ffffff",
                  fontWeight: activeTab === "all" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                Vue complète (Slides + Q&A)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("storyboard")}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: activeTab === "storyboard" ? "#e2e8f0" : "#ffffff",
                  fontWeight: activeTab === "storyboard" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                1. Storyboard 6 Slides
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("qa")}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: activeTab === "qa" ? "#e2e8f0" : "#ffffff",
                  fontWeight: activeTab === "qa" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                2. Objections Jury & Q&A
              </button>
            </div>
          </div>

          {/* Render sections adapting default order to deliverableSlug */}
          {activeTab === "storyboard" ? (
            renderStoryboardSection()
          ) : activeTab === "qa" ? (
            renderQaObjectionsSection()
          ) : isFinalObjectionsSlug ? (
            <>
              {renderQaObjectionsSection()}
              {renderStoryboardSection()}
            </>
          ) : (
            <>
              {renderStoryboardSection()}
              {renderQaObjectionsSection()}
            </>
          )}

          {/* Warn-only pedagogical readiness bar (R2 strict: never blocks submission) */}
          <div
            role="status"
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              fontSize: 12,
              color: "#334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>
              Progression indicative : <strong>{filledSlideCount}/6 diapositives</strong> ·{" "}
              <strong>{filledObjectionCount} réponse(s) Q&A</strong> ·{" "}
              <strong>{totalSeconds}s / 180s</strong>
            </span>
            {serializedMarkdown.trim().length === 0 ? (
              <span style={{ color: "#92400e", fontWeight: 600 }}>
                ⚠ Remplissez au moins une diapositive, une objection ou un lien pour soumettre.
              </span>
            ) : (
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                ✓ Prêt à être transmis au mentor
              </span>
            )}
          </div>

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
