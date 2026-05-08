// Phase 3 / Plan 02 - Evaluation form (Mentor side).
// Client component using useActionState for the evaluateSubmission server
// action. Renders one numeric input per rubric criterion, a feedback textarea,
// and 2-3 verdict submit buttons depending on the submission version.
//
// The score per criterion is constrained client-side via min/max but the
// server re-validates against the template's rubric (defense-in-depth).
"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateSubmission, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export type EvaluationFormProps = {
  submissionId: string;
  version: 1 | 2;
  rubric: { key: string; label: string; max: number }[];
};

export function EvaluationForm({ submissionId, version, rubric }: EvaluationFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(evaluateSubmission, initialState);
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(rubric.map((c) => [c.key, 0])),
  );

  const total = useMemo(
    () => Object.values(scores).reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0),
    [scores],
  );
  const scoresJson = useMemo(() => JSON.stringify(scores), [scores]);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const updateScore = (key: string, raw: string, max: number) => {
    const n = Math.max(0, Math.min(max, Math.round(Number(raw) || 0)));
    setScores((prev) => ({ ...prev, [key]: n }));
  };

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}
    >
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="scoresJson" value={scoresJson} />

      <fieldset
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <legend style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", padding: "0 4px" }}>
          {t.evaluation_scores_legend}
        </legend>
        {rubric.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>—</p>
        ) : (
          rubric.map((c) => (
            <label
              key={c.key}
              style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}
            >
              <span style={{ flex: 1, color: "#0f172a" }}>
                <strong>{c.label}</strong>{" "}
                <span style={{ color: "#64748b", fontSize: 12 }}>(max {c.max})</span>
              </span>
              <input
                type="number"
                min={0}
                max={c.max}
                step={1}
                value={scores[c.key] ?? 0}
                onChange={(e) => updateScore(c.key, e.target.value, c.max)}
                style={{
                  width: 80,
                  padding: "6px 10px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 14,
                  textAlign: "right",
                }}
              />
            </label>
          ))
        )}
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            color: "#0f172a",
            textAlign: "right",
            fontWeight: 600,
          }}
        >
          {t.evaluation_total_score}: {total}
        </p>
      </fieldset>

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.evaluation_feedback_label}</span>
        <textarea
          name="feedback"
          placeholder={t.evaluation_feedback_placeholder}
          rows={6}
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
          {t.evaluation_verdict_legend}
        </legend>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {version === 1 ? (
            <>
              <VerdictButton
                value="validate_v1"
                label={t.evaluation_verdict_validate_v1}
                tone="success"
                pending={pending}
              />
              <VerdictButton
                value="request_v2"
                label={t.evaluation_verdict_request_v2}
                tone="warning"
                pending={pending}
              />
              <VerdictButton
                value="reject"
                label={t.evaluation_verdict_reject}
                tone="danger"
                pending={pending}
              />
            </>
          ) : (
            <>
              <VerdictButton
                value="validate_v2"
                label={t.evaluation_verdict_validate_v2}
                tone="success"
                pending={pending}
              />
              <VerdictButton
                value="reject"
                label={t.evaluation_verdict_reject}
                tone="danger"
                pending={pending}
              />
            </>
          )}
        </div>
      </fieldset>

      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          style={{
            margin: 0,
            padding: "10px 14px",
            background: state.ok ? "#dcfce7" : "#fee2e2",
            color: state.ok ? "#15803d" : "#b91c1c",
            border: `1px solid ${state.ok ? "#86efac" : "#fecaca"}`,
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function VerdictButton({
  value,
  label,
  tone,
  pending,
}: {
  value: string;
  label: string;
  tone: "success" | "warning" | "danger";
  pending: boolean;
}) {
  const palette: Record<typeof tone, { bg: string; bgPending: string }> = {
    success: { bg: "#15803d", bgPending: "#86efac" },
    warning: { bg: "#b45309", bgPending: "#fcd34d" },
    danger: { bg: "#b91c1c", bgPending: "#fca5a5" },
  };
  const colors = palette[tone];
  return (
    <button
      type="submit"
      name="verdict"
      value={value}
      disabled={pending}
      style={{
        padding: "10px 14px",
        background: pending ? colors.bgPending : colors.bg,
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? t.evaluation_submitting : label}
    </button>
  );
}
