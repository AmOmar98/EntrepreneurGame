// T3X-EXPANSION wave 3 / plan 12-10 — Mentor bonus review form (client wrapper).
// Wraps reviewBonusEventFlow via useActionState so the form integrates with
// React 19 progressive enhancement and surfaces WorkflowState.message.
// R2 : message is rendered as-is (warn-only neutral colors).
"use client";

import { useActionState } from "react";
import { reviewBonusEventFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export function MentorBonusReviewForm({ bonusEventId }: { bonusEventId: string }) {
  const [state, formAction, pending] = useActionState(reviewBonusEventFlow, initialState);

  return (
    <form
      action={formAction}
      style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <input type="hidden" name="bonusEventId" value={bonusEventId} />
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
        <span style={{ fontWeight: 600 }}>{t.bonus_review_feedback_label}</span>
        <textarea
          name="feedback"
          rows={4}
          maxLength={2000}
          style={{
            padding: 8,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          name="decision"
          value="validated"
          disabled={pending}
          style={{
            padding: "10px 16px",
            background: pending ? "#94a3b8" : "#15803d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {t.bonus_review_validate}
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          style={{
            padding: "10px 16px",
            background: pending ? "#94a3b8" : "#b91c1c",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {t.bonus_review_reject}
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
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
