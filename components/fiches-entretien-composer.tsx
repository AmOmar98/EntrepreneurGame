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
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";

const initialState: WorkflowState = { ok: false, message: "" };

export function FichesEntretienComposer({
  deliverableTemplateId,
  locked = false,
  lockedReason,
}: {
  deliverableTemplateId: string;
  locked?: boolean;
  lockedReason?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDeliverable, initialState);
  const [urls, setUrls] = useState<string[]>(Array(10).fill(""));
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
          }}
        >
          {lockedReason ??
            "Préparation à valider par votre mentor avant de débloquer les fiches d'entretien."}
        </div>
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
