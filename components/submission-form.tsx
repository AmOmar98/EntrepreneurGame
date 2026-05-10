// Phase 2 / Plan 03 - Submission form (V1 only).
// Client component using useActionState for the submitDeliverable server action.
// On successful submit, refreshes the route so the server page re-renders in
// readonly mode (no client-side state to keep in sync).
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import { AutoSaveBadge } from "@/components/auto-save-badge";
import { FieldCompletionCounter } from "@/components/field-completion-counter";
import { PixelMascotPlayer } from "@/components/pixel-mascot-player";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useFirstDeliveryTrigger } from "@/hooks/use-pixel-trigger";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export function SubmissionForm({
  deliverableTemplateId,
  version = 1,
}: {
  deliverableTemplateId: string;
  version?: 1 | 2;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDeliverable, initialState);
  const [kind, setKind] = useState<"proof_url" | "proof_text">("proof_url");
  const submitLabel = version === 2 ? t.submission_v2_submit : t.submission_submit;

  // T3-A5 (a) — Pixel mascot 1er livrable soumis (mood euphorique).
  // Déclenchement déterministe : flip true UNE FOIS quand state.ok === true
  // pour la première soumission de ce navigateur (localStorage flag).
  const firstDelivery = useFirstDeliveryTrigger(state.ok);

  // A1 — Auto-save: ref wired to <form> so the hook can read FormData.
  const formRef = useRef<HTMLFormElement>(null);
  const { lastSavedAt, clear } = useAutoSave(formRef, {
    key: `eg_draft_${deliverableTemplateId}`,
  });

  useEffect(() => {
    if (state.ok) {
      // A1 — Purge draft from localStorage before refreshing the route.
      clear();
      router.refresh();
    }
  }, [state.ok, clear, router]);

  return (
    <>
    <form
      ref={formRef}
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}
    >
      <input type="hidden" name="deliverableTemplateId" value={deliverableTemplateId} />
      {/* A4 — Field completion counter: header of form, above the proof-kind fieldset. */}
      <FieldCompletionCounter formRef={formRef} />

      <fieldset
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <legend style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", padding: "0 4px" }}>
          {t.submission_kind_label}
        </legend>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input
            type="radio"
            name="kind"
            value="proof_url"
            checked={kind === "proof_url"}
            onChange={() => setKind("proof_url")}
          />
          {t.submission_kind_proof_url}
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input
            type="radio"
            name="kind"
            value="proof_text"
            checked={kind === "proof_text"}
            onChange={() => setKind("proof_text")}
          />
          {t.submission_kind_proof_text}
        </label>
      </fieldset>

      {kind === "proof_url" ? (
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.submission_url_label}</span>
          <input
            type="url"
            name="proofUrl"
            placeholder={t.submission_url_placeholder}
            required
            pattern="https://.*"
            style={{
              padding: "8px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </label>
      ) : (
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.submission_text_label}</span>
          <textarea
            name="proofText"
            placeholder={t.submission_text_placeholder}
            required
            rows={10}
            maxLength={4000}
            style={{
              padding: "8px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </label>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "10px 16px",
          background: pending ? "#94a3b8" : "#1d4ed8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {pending ? t.submission_submitting : submitLabel}
      </button>

      {/* A1 — Auto-save badge: footer of form, after submit button, before state message. */}
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
  );
}
