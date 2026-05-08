// Phase 2 / Plan 03 - Submission form (V1 only).
// Client component using useActionState for the submitDeliverable server action.
// On successful submit, refreshes the route so the server page re-renders in
// readonly mode (no client-side state to keep in sync).
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDeliverable, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export function SubmissionForm({ deliverableTemplateId }: { deliverableTemplateId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitDeliverable, initialState);
  const [kind, setKind] = useState<"proof_url" | "proof_text">("proof_url");

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}
    >
      <input type="hidden" name="deliverableTemplateId" value={deliverableTemplateId} />

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
        {pending ? t.submission_submitting : t.submission_submit}
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
