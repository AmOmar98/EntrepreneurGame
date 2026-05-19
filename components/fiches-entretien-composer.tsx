// quick-260519-l1l : 10-URL HTTPS composer for fiches-entretien-v1.
// Q2-Omar 2026-05-19 : 10 input URL HTTPS, packagés en JSON dans proof_text.
// Server-side branch dans submitDeliverable parse JSON et auto-valide (Q5).
//
// R1 preserved : aucun affichage de note (25/25 par fiche), aucun total /250
// affiché côté Player. Composer reste neutre numériquement. Le breakdown des
// notes est rendu UNIQUEMENT par <DeliverableScoreBlock> sur la page détail
// après soumission, via la ligne evaluations auto-insérée.
//
// R2 preserved : Zod côté server bloque le payload mal formé (erreur technique
// JSON ≠ erreur pédagogique rubric — distinction documentée dans ADVISOR-VERDICT).
//
// R3 — hard-block exception : si prep-questions-v1 pas validée, le composer
// reçoit `locked={true}` depuis la page détail, désactive submit + affiche
// message ambre. Server REJETTE quand même côté backend (defense in depth).
//
// quick-260519-uuy / Task 3 — le prop `prepQuestionsDeliverableId` matérialise
// l'EXCEPTION UNIQUE L2 prep→entretien signée Omar 2026-05-19. Il sert
// uniquement à rendre un Link CTA "Revenir à la préparation 2A" dans la
// bannière locked. NE PAS généraliser ce prop à d'autres dépendances ni
// introduire de mécanisme générique (`requires`, `dependsOn`, ...) — toute
// nouvelle exception doit repasser par l'advisor pédagogique (cf. CLAUDE.md).
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export function FichesEntretienComposer({
  deliverableTemplateId,
  locked = false,
  lockedReason,
  prepQuestionsDeliverableId,
}: {
  deliverableTemplateId: string;
  locked?: boolean;
  lockedReason?: string;
  // quick-260519-uuy / Task 3 — optional + nullable. When null (e.g. prep
  // template absent from seed), the Link is NOT rendered, the locked banner
  // shows the textual reason alone. This is the L2 exception only.
  prepQuestionsDeliverableId?: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDeliverable, initialState);
  const [urls, setUrls] = useState<string[]>(Array(10).fill(""));
  const [bulkPaste, setBulkPaste] = useState("");
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const allFilled = urls.every((u) => u.trim().length > 0);
  const submitDisabled = pending || locked || !allFilled;

  // Build proof_text JSON when form submits — done client-side via a hidden
  // input refreshed on each render (synchronous, deterministic).
  const proofTextJson = JSON.stringify({
    fiches: urls.map((url) => ({ url: url.trim() })),
  });

  // quick-260519-l1l followup : bulk paste UX. Parse newline/comma/space-
  // separated URLs, take first 10 non-empty entries, fill inputs. Non-https
  // entries are still placed (user sees + corrects them via the input's
  // pattern validator); we just report the count in the feedback line.
  function handleBulkApply() {
    const parts = bulkPaste
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) {
      setBulkFeedback("Rien à coller — la zone de texte est vide.");
      return;
    }
    const next: string[] = Array(10).fill("");
    for (let i = 0; i < Math.min(10, parts.length); i += 1) {
      next[i] = parts[i] ?? "";
    }
    setUrls(next);
    const httpsCount = parts
      .slice(0, 10)
      .filter((p) => p.startsWith("https://")).length;
    const placed = Math.min(10, parts.length);
    const ignored = parts.length - placed;
    const httpsMsg =
      httpsCount < placed
        ? ` — ${placed - httpsCount} URL(s) non https à corriger.`
        : "";
    const ignoredMsg = ignored > 0 ? ` ${ignored} entrée(s) ignorée(s) au-delà de 10.` : "";
    setBulkFeedback(`${placed}/10 URLs réparties.${httpsMsg}${ignoredMsg}`);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}
    >
      <input type="hidden" name="deliverableTemplateId" value={deliverableTemplateId} />
      <input type="hidden" name="kind" value="proof_text" />
      <input type="hidden" name="proofText" value={proofTextJson} />

      {locked ? (
        <div
          role="status"
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            color: "#92400e",
            fontSize: 13,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span>
            {lockedReason ??
              "Préparation à valider par votre mentor avant de débloquer les fiches d'entretien."}
          </span>
          {prepQuestionsDeliverableId ? (
            <Link
              href={`/journey/deliverable/${prepQuestionsDeliverableId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: "#92400e",
                color: "#fef3c7",
                fontSize: 12,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              ← {t.fiches_locked_cta_back_to_prep}
            </Link>
          ) : null}
        </div>
      ) : null}

      {!locked ? (
        <details
          className="eic-bulk-paste"
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: 8,
            padding: "10px 14px",
            background: "#f8fafc",
            fontSize: 13,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 500,
              color: "#1B3A5C",
              listStyle: "none",
            }}
          >
            📋 Coller 10 URLs en bloc (depuis Notion, Sheets, etc.)
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Collez vos URLs séparées par retour à la ligne, virgule, point-virgule ou
              espace. Les 10 premières sont réparties dans les inputs ci-dessous (vous
              pouvez ensuite ajuster).
            </p>
            <textarea
              value={bulkPaste}
              onChange={(e) => setBulkPaste(e.target.value)}
              placeholder={"https://notion.so/...\nhttps://docs.google.com/...\n... (10 URLs)"}
              rows={4}
              className="eic-form-input"
              style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.4 }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleBulkApply}
                className="eic-button--secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: "#1B3A5C",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Répartir dans les 10 inputs
              </button>
              {bulkFeedback ? (
                <span style={{ fontSize: 12, color: "#475569" }}>{bulkFeedback}</span>
              ) : null}
            </div>
          </div>
        </details>
      ) : null}

      <fieldset
        disabled={locked}
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          opacity: locked ? 0.55 : 1,
        }}
      >
        <legend style={{ padding: "0 8px", fontWeight: 600, color: "#0f172a", fontSize: 14 }}>
          10 fiches d&apos;entretien terrain
        </legend>
        <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
          Chaque fiche = 1 URL HTTPS (Notion, Google Doc, fichier markdown partagé).
          Les 10 URLs sont validées automatiquement à la soumission.
        </p>
        {urls.map((value, idx) => (
          <label
            key={idx}
            className="eic-form-field"
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span
              className="eic-form-field__label"
              style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}
            >
              Fiche {idx + 1}
            </span>
            <input
              type="url"
              required
              pattern="https://.*"
              placeholder="https://..."
              value={value}
              onChange={(e) => {
                const next = [...urls];
                next[idx] = e.target.value;
                setUrls(next);
              }}
              className="eic-form-input"
              disabled={locked}
            />
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={submitDisabled}
        className="eic-button--submit"
        style={{ opacity: submitDisabled ? 0.5 : 1 }}
      >
        {pending
          ? "Envoi en cours..."
          : locked
            ? "Préparation 2A requise"
            : allFilled
              ? "Soumettre les 10 fiches"
              : "Compléter les 10 URLs"}
      </button>

      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          style={{
            margin: 0,
            fontSize: 13,
            color: state.ok ? "#15803d" : "#b91c1c",
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
